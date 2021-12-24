import { Redis } from 'ioredis'
import {
  getRedisTime,
  RedisModel,
  RedisType,
  RedisTypeLiteral,
} from '../db/redis'

export interface AtonalKVOptions<T extends RedisType> {
  name: string
  type: RedisTypeLiteral
  defaultValue?: Record<string, T>
}

export class AtonalKV<T extends RedisType> extends RedisModel<T> {
  constructor(private readonly opts: AtonalKVOptions<T>) {
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

export const useKV = <T extends RedisType>(opts: AtonalKVOptions<T>) =>
  new AtonalKV(opts)
