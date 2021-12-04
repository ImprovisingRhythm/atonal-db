import { Redis } from 'ioredis'
import { mapValues } from 'lodash'
import { RedisValueNativeType, RedisModel, RedisValueType } from '../db/redis'

export interface AtonalMapOptions<T extends RedisValueType> {
  name: string
  type: T
  defaultValue?: Record<string, RedisValueNativeType<T>>
}

export class AtonalMap<T extends RedisValueType> extends RedisModel<T> {
  constructor(private opts: AtonalMapOptions<T>) {
    super(opts.name, opts.type)
  }

  protected async _init(client: Redis) {
    super._init(client)

    if (this.opts.defaultValue) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.assign(this.opts.defaultValue)
      }
    }
  }

  async set(key: string, value: RedisValueNativeType<T>) {
    return this.getClient().hset(this.key, key, this.stringify(value))
  }

  async assign(data: Record<string, RedisValueNativeType<T>>) {
    return this.getClient().hset(
      this.key,
      mapValues(data, value => this.stringify(value)),
    )
  }

  async get(key: string) {
    const value = await this.getClient().hget(this.key, key)

    if (value === null) {
      return null
    }

    return this.parse(value)
  }

  async getAll() {
    const data = await this.getClient().hgetall(this.key)

    return mapValues(data, value => this.parse(value))
  }

  async remove(key: string) {
    return this.getClient().hdel(this.key, key)
  }

  async has(key: string) {
    const res = await this.getClient().hexists(this.key, key)
    return !!res
  }

  async size() {
    return this.getClient().hlen(this.key)
  }

  async clear() {
    return this.getClient().del(this.key)
  }
}

export const useMap = <T extends RedisValueType>(opts: AtonalMapOptions<T>) =>
  new AtonalMap(opts)
