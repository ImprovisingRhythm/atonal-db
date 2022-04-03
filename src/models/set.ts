import Redis from 'ioredis'
import { RedisValueNativeType, RedisModel, RedisValueType } from '../db/redis'

export interface AtonalSetOptions<T extends RedisValueType> {
  name: string
  type: T
  defaultValues?: RedisValueNativeType<T>[]
}

export class AtonalSet<T extends RedisValueType> extends RedisModel<T> {
  constructor(private readonly opts: AtonalSetOptions<T>) {
    super(opts.name, opts.type)
  }

  protected async _init(client: Redis) {
    await super._init(client)

    if (this.opts.defaultValues) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.add(...this.opts.defaultValues)
      }
    }
  }

  async add(...values: RedisValueNativeType<T>[]) {
    return this.client.sadd(this.key, ...this.stringifyMany(values))
  }

  async remove(value: RedisValueNativeType<T>) {
    return this.client.srem(this.key, this.stringify(value))
  }

  async has(value: RedisValueNativeType<T>) {
    const res = await this.client.sismember(this.key, this.stringify(value))

    return Boolean(res)
  }

  async values<R = RedisValueNativeType<T>>() {
    const values = await this.client.smembers(this.key)

    return this.parseMany(values) as R[]
  }

  async size() {
    return this.client.scard(this.key)
  }

  async intersection<R = RedisValueNativeType<T>>(...items: AtonalSet<T>[]) {
    const values: string[] = await this.client.sinter(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values) as R[]
  }

  async difference<R = RedisValueNativeType<T>>(...items: AtonalSet<T>[]) {
    const values: string[] = await this.client.sdiff(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values) as R[]
  }

  async union<R = RedisValueNativeType<T>>(...items: AtonalSet<T>[]) {
    const values: string[] = await this.client.sunion(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values) as R[]
  }

  async clear() {
    return this.client.del(this.key)
  }
}

export const useSet = <T extends RedisValueType>(opts: AtonalSetOptions<T>) =>
  new AtonalSet(opts)
