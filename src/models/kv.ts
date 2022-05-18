import Redis from 'ioredis'
import { getRedisTime } from '../common/time'
import { RedisValueNativeType, RedisModel, RedisValueType } from '../db/redis'

export interface AtonalKVOptions<T extends RedisValueType> {
  name: string
  type: T
  defaultValue?: Record<string, RedisValueNativeType<T>>
}

export class AtonalKV<T extends RedisValueType> extends RedisModel<T> {
  constructor(private readonly opts: AtonalKVOptions<T>) {
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

  async set(
    key: string,
    value: RedisValueNativeType<T>,
    expiresIn?: string | number,
  ) {
    if (expiresIn) {
      return this.client.set(
        `${this.key}:${key}`,
        this.stringify(value),
        'EX',
        getRedisTime(expiresIn),
      )
    } else {
      return this.client.set(`${this.key}:${key}`, this.stringify(value))
    }
  }

  async assign(
    data: Record<string, RedisValueNativeType<T>>,
    expiresIn?: string | number,
  ) {
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        this.set(key, value, expiresIn),
      ),
    )
  }

  async get<R = RedisValueNativeType<T>>(key: string) {
    const value = await this.client.get(`${this.key}:${key}`)

    if (value === null) {
      return null
    }

    return this.parse(value) as R
  }

  async remove(key: string) {
    return this.client.del(`${this.key}:${key}`)
  }

  async has(key: string) {
    const res = await this.client.exists(`${this.key}:${key}`)

    return Boolean(res)
  }

  async expire(key: string, expiresIn: string | number) {
    return this.client.expire(`${this.key}:${key}`, getRedisTime(expiresIn))
  }

  async ttl(key: string) {
    return this.client.ttl(`${this.key}:${key}`)
  }

  async incr(key: string) {
    if (this.opts.type !== 'number') {
      throw new Error('incr only supports number type')
    }

    return this.client.incr(`${this.key}:${key}`)
  }

  async incrby(key: string, amount: number) {
    if (this.opts.type !== 'number') {
      throw new Error('incrby only supports number type')
    }

    return this.client.incrby(`${this.key}:${key}`, amount)
  }

  async incrbyfloat(key: string, amount: number) {
    if (this.opts.type !== 'number') {
      throw new Error('incrbyfloat only supports number type')
    }

    return this.client.incrbyfloat(`${this.key}:${key}`, amount)
  }
}

export const useKV = <T extends RedisValueType>(opts: AtonalKVOptions<T>) =>
  new AtonalKV(opts)
