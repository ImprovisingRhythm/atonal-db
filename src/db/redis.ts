import IORedis, { Redis } from 'ioredis'

export type TypeLabel = 'string' | 'number' | 'record'
export type NativeType<T extends TypeLabel> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : Record<string, any>

export class RedisModel<T extends TypeLabel = 'string'> {
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

  protected stringify(value: NativeType<T>) {
    if (this.type === 'string' || this.type === 'number') {
      return String(value)
    }

    return JSON.stringify(value)
  }

  protected stringifyMany(values: NativeType<T>[]) {
    if (this.type === 'string' || this.type === 'number') {
      return values.map(value => String(value))
    }

    return values.map(value => JSON.stringify(value))
  }

  protected parse(value: string) {
    if (this.type === 'number') {
      return Number(value) as NativeType<T>
    }

    if (this.type === 'record') {
      return JSON.parse(value) as NativeType<T>
    }

    return value as NativeType<T>
  }

  protected parseMany(values: string[]) {
    if (this.type === 'number') {
      return values.map(value => Number(value)) as NativeType<T>[]
    }

    if (this.type === 'record') {
      return values.map(value => JSON.parse(value)) as NativeType<T>[]
    }

    return values as NativeType<T>[]
  }
}

export interface RedisConfig {
  port: number
  host: string
  password?: string
  db?: number
  keyPrefix?: string
}

export const useRedis = ({
  port,
  host,
  password,
  db,
  keyPrefix,
}: RedisConfig) => {
  return new Promise<Redis>(resolve => {
    const client = new IORedis({
      port,
      host,
      password,
      db,
      keyPrefix,
      dropBufferSupport: true,
      enableAutoPipelining: true,
      noDelay: false,
    })

    client.once('ready', () => resolve(client))
  })
}
