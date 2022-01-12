import { Redis } from 'ioredis'
import {
  RedisValueNativeType,
  RedisModel,
  RedisValueType,
  getRedisTime,
} from '../db/redis'

export interface AtonalValueOptions<T extends RedisValueType> {
  name: string
  type: T
  defaultValue?: RedisValueNativeType<T>
}

export class AtonalValue<T extends RedisValueType> extends RedisModel<T> {
  constructor(private readonly opts: AtonalValueOptions<T>) {
    super(opts.name, opts.type)
  }

  protected async _init(client: Redis) {
    await super._init(client)

    if (this.opts.defaultValue) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.set(this.opts.defaultValue)
      }
    }
  }

  async set(value: RedisValueNativeType<T>, expiresIn?: string | number) {
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

  async get<CustomType = RedisValueNativeType<T>>() {
    const value = await this.getClient().get(this.key)

    if (value === null) {
      return null
    }

    return this.parse(value) as CustomType
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

export const useValue = <T extends RedisValueType>(
  opts: AtonalValueOptions<T>,
) => new AtonalValue(opts)
