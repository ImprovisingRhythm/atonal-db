import Redis from 'ioredis'
import { getRedisTime } from '../common/time'
import { RedisValueNativeType, RedisModel, RedisValueType } from '../db/redis'

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
    if (expiresIn) {
      return this.client.set(
        this.key,
        this.stringify(value),
        'EX',
        getRedisTime(expiresIn),
      )
    } else {
      return this.client.set(this.key, this.stringify(value))
    }
  }

  async get<CustomType = RedisValueNativeType<T>>() {
    const value = await this.client.get(this.key)

    if (value === null) {
      return null
    }

    return this.parse(value) as CustomType
  }

  async delete() {
    return this.client.del(this.key)
  }

  async expire(expiresIn: string | number) {
    return this.client.expire(this.key, getRedisTime(expiresIn))
  }

  async ttl() {
    return this.client.ttl(this.key)
  }

  async incr() {
    if (this.opts.type !== 'number') {
      throw new Error('incr only supports number type')
    }

    return this.client.incr(this.key)
  }

  async incrby(amount: number) {
    if (this.opts.type !== 'number') {
      throw new Error('incrby only supports number type')
    }

    return this.client.incrby(this.key, amount)
  }

  async incrbyfloat(amount: number) {
    if (this.opts.type !== 'number') {
      throw new Error('incrbyfloat only supports number type')
    }

    return this.client.incrbyfloat(this.key, amount)
  }
}

export const useValue = <T extends RedisValueType>(
  opts: AtonalValueOptions<T>,
) => new AtonalValue(opts)
