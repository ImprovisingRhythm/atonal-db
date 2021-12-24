import { Redis } from 'ioredis'
import { RedisModel, RedisType, RedisTypeLiteral } from '../db/redis'

export interface AtonalSetOptions<T extends RedisType> {
  name: string
  type: RedisTypeLiteral
  defaultValues?: T[]
}

export class AtonalSet<T extends RedisType> extends RedisModel<T> {
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

  async add(...values: T[]) {
    return this.getClient().sadd(this.key, ...this.stringifyMany(values))
  }

  async remove(value: T) {
    return this.getClient().srem(this.key, this.stringify(value))
  }

  async has(value: T) {
    const res = await this.getClient().sismember(
      this.key,
      this.stringify(value),
    )

    return !!res
  }

  async values() {
    const values = await this.getClient().smembers(this.key)

    return this.parseMany(values)
  }

  async size() {
    return this.getClient().scard(this.key)
  }

  async intersection(...items: AtonalSet<T>[]) {
    const values: string[] = await this.getClient().sinter(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values)
  }

  async difference(...items: AtonalSet<T>[]) {
    const values: string[] = await this.getClient().sdiff(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values)
  }

  async union(...items: AtonalSet<T>[]) {
    const values: string[] = await this.getClient().sunion(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values)
  }

  async clear() {
    return this.getClient().del(this.key)
  }
}

export const useSet = <T extends RedisType>(opts: AtonalSetOptions<T>) =>
  new AtonalSet(opts)
