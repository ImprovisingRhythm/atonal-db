import Redis, { RedisOptions } from 'ioredis'
import { InitableModel } from './model'

export type RedisValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'record'

export type RedisValueNativeType<T extends RedisValueType> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : T extends 'boolean'
  ? boolean
  : T extends 'array'
  ? Array<any>
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
      return (value === '1') as RedisValueNativeType<T>
    }

    if (this.type === 'array' || this.type === 'record') {
      return JSON.parse(value) as RedisValueNativeType<T>
    }

    return value as RedisValueNativeType<T>
  }

  protected parseMany(values: string[]) {
    if (this.type === 'number') {
      return values.map(value => Number(value)) as RedisValueNativeType<T>[]
    }

    if (this.type === 'boolean') {
      return values.map(value => value === '1') as RedisValueNativeType<T>[]
    }

    if (this.type === 'array' || this.type === 'record') {
      return values.map(value => JSON.parse(value)) as RedisValueNativeType<T>[]
    }

    return values as RedisValueNativeType<T>[]
  }
}

export interface RedisConfig extends RedisOptions {}

export const useRedis = (config: RedisConfig) => {
  return new Promise<Redis>(resolve => {
    const client = new Redis(config)

    client.once('ready', () => resolve(client))
  })
}
