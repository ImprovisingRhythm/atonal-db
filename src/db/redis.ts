import IORedis, { Redis, RedisOptions } from 'ioredis'
import ms from 'ms'
import { InitableModel } from './model'

export const getRedisTime = (time: string | number) => {
  if (typeof time === 'string') {
    return ms(time) / 1000
  }

  return time
}

export type RedisTypeKey = 'string' | 'number' | 'boolean' | 'record'
export type RedisType = string | number | boolean | Record<string, any>

export type GetRedisTypeFromKey<T extends RedisTypeKey> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : T extends 'boolean'
  ? boolean
  : Record<string, any>

export class RedisModel<
  K extends RedisTypeKey = RedisTypeKey,
  T extends RedisType = GetRedisTypeFromKey<K>,
> extends InitableModel<Redis> {
  constructor(private name: string, private type: K) {
    super()
  }

  protected get key() {
    return this.name
  }

  protected stringify(value: T) {
    if (this.type === 'string' || this.type === 'number') {
      return String(value)
    }

    if (this.type === 'boolean') {
      return value ? '1' : '0'
    }

    return JSON.stringify(value)
  }

  protected stringifyMany(values: T[]) {
    if (this.type === 'string' || this.type === 'number') {
      return values.map(value => String(value))
    }

    if (this.type === 'boolean') {
      return values.map(value => (value ? '1' : '0'))
    }

    return values.map(value => JSON.stringify(value))
  }

  protected parse(value: string) {
    if (this.type === 'number') {
      return Number(value) as T
    }

    if (this.type === 'boolean') {
      return (value === '1' ? true : false) as T
    }

    if (this.type === 'record') {
      return JSON.parse(value) as T
    }

    return value as T
  }

  protected parseMany(values: string[]) {
    if (this.type === 'number') {
      return values.map(value => Number(value)) as T[]
    }

    if (this.type === 'boolean') {
      return values.map(value => (value === '1' ? true : false)) as T[]
    }

    if (this.type === 'record') {
      return values.map(value => JSON.parse(value)) as T[]
    }

    return values as T[]
  }
}

export interface RedisConfig extends RedisOptions {}

export const useRedis = (config: RedisConfig) => {
  return new Promise<Redis>(resolve => {
    const client = new IORedis(config)

    client.once('ready', () => resolve(client))
  })
}
