import IORedis, { Redis } from 'ioredis'
import ms from 'ms'
import { InitableModel } from './model'

export const getRedisTime = (time: string | number) => {
  if (typeof time === 'string') {
    return ms(time) / 1000
  }

  return time
}

export type RedisValueType = 'string' | 'number' | 'boolean' | 'record'
export type RedisValueNativeType<T extends RedisValueType> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : T extends 'boolean'
  ? boolean
  : Record<string, any>

export class RedisModel<T extends RedisValueType> extends InitableModel<Redis> {
  constructor(private name: string, private type: T) {
    super()
  }

  protected get key() {
    return this.name
  }

  protected stringify(value: RedisValueNativeType<T>) {
    if (this.type === 'string' || this.type === 'number') {
      return String(value)
    }

    if (this.type === 'boolean') {
      return value ? '1' : '0'
    }

    return JSON.stringify(value)
  }

  protected stringifyMany(values: RedisValueNativeType<T>[]) {
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
      return Number(value) as RedisValueNativeType<T>
    }

    if (this.type === 'boolean') {
      return (value === '1' ? true : false) as RedisValueNativeType<T>
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

    if (this.type === 'boolean') {
      return values.map(value =>
        value === '1' ? true : false,
      ) as RedisValueNativeType<T>[]
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
