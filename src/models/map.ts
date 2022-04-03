import Redis from 'ioredis'
import { mapValues } from 'lodash'
import { RedisValueNativeType, RedisModel, RedisValueType } from '../db/redis'

export interface AtonalMapOptions<T extends RedisValueType> {
  name: string
  type: T
  defaultValue?: Record<string, RedisValueNativeType<T>>
}

export class AtonalMap<T extends RedisValueType> extends RedisModel<T> {
  constructor(private readonly opts: AtonalMapOptions<T>) {
    super(opts.name, opts.type)
  }

  protected async _init(client: Redis) {
    await super._init(client)

    if (this.opts.defaultValue) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.assign(this.opts.defaultValue)
      }
    }
  }

  async set(key: string, value: RedisValueNativeType<T>) {
    return this.client.hset(this.key, key, this.stringify(value))
  }

  async assign(data: Record<string, RedisValueNativeType<T>>) {
    return this.client.hset(
      this.key,
      mapValues(data, value => this.stringify(value)),
    )
  }

  async get<R = RedisValueNativeType<T>>(key: string) {
    const value = await this.client.hget(this.key, key)

    if (value === null) {
      return null
    }

    return this.parse(value) as R
  }

  async getAll<R = RedisValueNativeType<T>>() {
    const data = await this.client.hgetall(this.key)

    return mapValues(data, value => this.parse(value)) as Record<string, R>
  }

  async remove(key: string) {
    return this.client.hdel(this.key, key)
  }

  async has(key: string) {
    const res = await this.client.hexists(this.key, key)

    return Boolean(res)
  }

  async size() {
    return this.client.hlen(this.key)
  }

  async clear() {
    return this.client.del(this.key)
  }
}

export const useMap = <T extends RedisValueType>(opts: AtonalMapOptions<T>) =>
  new AtonalMap(opts)
