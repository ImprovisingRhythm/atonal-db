import { Redis } from 'ioredis'
import {
  getRedisTime,
  RedisModel,
  RedisType,
  RedisTypeLiteral,
} from '../db/redis'

export interface AtonalValueOptions<T extends RedisType> {
  name: string
  type: RedisTypeLiteral
  defaultValue?: T
}

export class AtonalValue<T extends RedisType> extends RedisModel<T> {
  constructor(private readonly opts: AtonalValueOptions<T>) {
    super(opts.name, opts.type)
  }

  protected async _init(client: Redis) {
    super._init(client)

    if (this.opts.defaultValue) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.set(this.opts.defaultValue)
      }
    }
  }

  async set(value: T, expiresIn?: string | number) {
    const client = this.getClient()

    if (expiresIn) {
      return client.set(
        this.key,
        this.stringify(value),
        'EX',
        getRedisTime(expiresIn),
      )
    } else {
      return client.set(this.key, this.stringify(value))
    }
  }

  async get() {
    const value = await this.getClient().get(this.key)

    if (value === null) {
      return null
    }

    return this.parse(value)
  }

  async delete() {
    return this.getClient().del(this.key)
  }

  async expire(expiresIn: string | number) {
    return this.getClient().expire(this.key, getRedisTime(expiresIn))
  }

  async ttl() {
    return this.getClient().ttl(this.key)
  }
}

export const useValue = <T extends RedisType>(opts: AtonalValueOptions<T>) =>
  new AtonalValue(opts)
