import IORedis, { Redis } from 'ioredis'
import ms from 'ms'

export const getRedisTime = (time: string | number) => {
  if (typeof time === 'string') {
    return ms(time) / 1000
  }

  return time
}

export type RedisValueType = 'string' | 'number' | 'record'
export type RedisValueNativeType<T extends RedisValueType> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : Record<string, any>

export class RedisModel<T extends RedisValueType = 'string'> {
  private client?: Redis

  constructor(private name: string, private type: T) {}

  protected _init(client: Redis) {
    if (this.client) {
      throw new Error('already initialized')
    }

    this.client = client
  }

  protected get key() {
    return this.name
  }

  protected getClient() {
    if (!this.client) {
      throw new Error('need initialize first')
    }

    return this.client
  }

  protected stringify(value: RedisValueNativeType<T>) {
    if (this.type === 'string' || this.type === 'number') {
      return String(value)
    }

    return JSON.stringify(value)
  }

  protected stringifyMany(values: RedisValueNativeType<T>[]) {
    if (this.type === 'string' || this.type === 'number') {
      return values.map(value => String(value))
    }

    return values.map(value => JSON.stringify(value))
  }

  protected parse(value: string) {
    if (this.type === 'number') {
      return Number(value) as RedisValueNativeType<T>
    }

    if (this.type === 'record') {
      return JSON.parse(value) as RedisValueNativeType<T>
    }

    return value as RedisValueNativeType<T>
  }

  protected parseMany(values: string[]) {
    if (this.type === 'number') {
      return values.map(value => Number(value)) as RedisValueNativeType<T>[]
    }

    if (this.type === 'record') {
      return values.map(value => JSON.parse(value)) as RedisValueNativeType<T>[]
    }

    return values as RedisValueNativeType<T>[]
  }
}

export interface RedisConfig {
  port: number
  host: string
  password?: string
  db?: number
}

export const useRedis = ({ port, host, password, db }: RedisConfig) => {
  return new Promise<Redis>(resolve => {
    const client = new IORedis({
      port,
      host,
      password,
      db,
      dropBufferSupport: true,
      enableAutoPipelining: true,
      noDelay: false,
    })

    client.once('ready', () => resolve(client))
  })
}
