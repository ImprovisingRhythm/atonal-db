import { Redis } from 'ioredis'
import {
  RedisModel,
  getRedisTime,
  RedisTypeKey,
  RedisType,
  GetRedisTypeFromKey,
} from '../db/redis'

export interface AtonalKVOptions<
  K extends RedisTypeKey,
  T extends RedisType = GetRedisTypeFromKey<K>,
> {
  name: string
  type: K
  defaultValue?: Record<string, T>
}

export class AtonalKV<
  K extends RedisTypeKey,
  T extends RedisType = GetRedisTypeFromKey<K>,
> extends RedisModel<K, T> {
  constructor(private readonly opts: AtonalKVOptions<K, T>) {
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

  async set(key: string, value: T, expiresIn?: string | number) {
    const client = this.getClient()

    if (expiresIn) {
      return client.set(
        `${this.key}:${key}`,
        this.stringify(value),
        'EX',
        getRedisTime(expiresIn),
      )
    } else {
      return client.set(`${this.key}:${key}`, this.stringify(value))
    }
  }

  async assign(data: Record<string, T>, expiresIn?: string | number) {
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        this.set(key, value, expiresIn),
      ),
    )
  }

  async get(key: string) {
    const value = await this.getClient().get(`${this.key}:${key}`)

    if (value === null) {
      return null
    }

    return this.parse(value)
  }

  async remove(key: string) {
    await this.getClient().del(`${this.key}:${key}`)
  }

  async has(key: string) {
    const res = await this.getClient().exists(`${this.key}:${key}`)
    return !!res
  }

  async expire(key: string, expiresIn: string | number) {
    return this.getClient().expire(
      `${this.key}:${key}`,
      getRedisTime(expiresIn),
    )
  }

  async ttl(key: string) {
    return this.getClient().ttl(`${this.key}:${key}`)
  }
}

export const useKV = <
  K extends RedisTypeKey,
  T extends RedisType = GetRedisTypeFromKey<K>,
>(
  opts: AtonalKVOptions<K, T>,
) => new AtonalKV(opts)
