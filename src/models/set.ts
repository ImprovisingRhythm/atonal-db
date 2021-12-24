import { Redis } from 'ioredis'
import {
  GetRedisTypeFromKey,
  RedisModel,
  RedisTypeKey,
  RedisType,
} from '../db/redis'

export interface AtonalSetOptions<
  K extends RedisTypeKey,
  T extends RedisType = GetRedisTypeFromKey<K>,
> {
  name: string
  type: K
  defaultValues?: T[]
}

export class AtonalSet<
  K extends RedisTypeKey,
  T extends RedisType = GetRedisTypeFromKey<K>,
> extends RedisModel<K, T> {
  constructor(private readonly opts: AtonalSetOptions<K, T>) {
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

  async intersection(...items: AtonalSet<K, T>[]) {
    const values: string[] = await this.getClient().sinter(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values)
  }

  async difference(...items: AtonalSet<K, T>[]) {
    const values: string[] = await this.getClient().sdiff(
      this.key,
      ...items.map(item => item.key),
    )

    return this.parseMany(values)
  }

  async union(...items: AtonalSet<K, T>[]) {
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

export const useSet = <
  K extends RedisTypeKey,
  T extends RedisType = GetRedisTypeFromKey<K>,
>(
  opts: AtonalSetOptions<K, T>,
) => new AtonalSet(opts)
