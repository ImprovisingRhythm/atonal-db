import { Redis } from 'ioredis'
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
    super._init(client)

    if (this.opts.defaultValues) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.add(...this.opts.defaultValues)
      }
    }
  }

  async add(...values: RedisValueNativeType<T>[]) {
    return this.getClient().sadd(this.key, ...this.stringifyMany(values))
  }

  async remove(value: RedisValueNativeType<T>) {
    return this.getClient().srem(this.key, this.stringify(value))
  }

  async has(value: RedisValueNativeType<T>) {
    const res = await this.getClient().sismember(
      this.key,
      this.stringify(value),
    )

    return !!res
  }

  async values<R = RedisValueNativeType<T>>() {
    const values = await this.getClient().smembers(this.key)

    return this.parseMany(values) as R[]
  }

  async size() {
    return this.getClient().scard(this.key)
  }

  async intersection<R = RedisValueNativeType<T>>(...items: AtonalSet<T>[]) {
    const values: string[] = await this.getClient().sinter(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values) as R[]
  }

  async difference<R = RedisValueNativeType<T>>(...items: AtonalSet<T>[]) {
    const values: string[] = await this.getClient().sdiff(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values) as R[]
  }

  async union<R = RedisValueNativeType<T>>(...items: AtonalSet<T>[]) {
    const values: string[] = await this.getClient().sunion(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values) as R[]
  }

  async clear() {
    return this.getClient().del(this.key)
  }
}

export const useSet = <T extends RedisValueType>(opts: AtonalSetOptions<T>) =>
  new AtonalSet(opts)
