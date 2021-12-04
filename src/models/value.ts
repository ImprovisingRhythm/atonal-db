import { Redis } from 'ioredis'
import { NativeType, RedisModel, TypeLabel } from '../db/redis'

export interface AtonalValueOptions<T extends TypeLabel> {
  name: string
  type: T
  defaultValue?: NativeType<T>
}

export class AtonalValue<T extends TypeLabel> extends RedisModel<T> {
  constructor(private opts: AtonalValueOptions<T>) {
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

  async set(value: NativeType<T>) {
    return this.getClient().set(this.key, this.stringify(value))
  }

  async get() {
    const value = await this.getClient().get(this.key)

    if (value === null) {
      return null
    }

    return this.parse(value)
  }

  async delete() {
    await this.getClient().del(this.key)
  }
}

export const useValue = <T extends TypeLabel>(opts: AtonalValueOptions<T>) =>
  new AtonalValue(opts)
