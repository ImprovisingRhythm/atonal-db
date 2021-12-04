import { Redis } from 'ioredis'
import { NativeType, RedisModel, TypeLabel } from '../db/redis'

export interface AtonalSetOptions<T extends TypeLabel> {
  name: string
  type: T
  defaultValues?: NativeType<T>[]
}

export class AtonalSet<T extends TypeLabel> extends RedisModel<T> {
  constructor(private opts: AtonalSetOptions<T>) {
    super(opts.name, opts.type)
  }

  protected async _init(client: Redis) {
    super._init(client)

    if (this.opts.defaultValues) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.add(...this.opts.defaultValues)
      }
    }
  }

  async add(...values: NativeType<T>[]) {
    return this.getClient().sadd(this.key, ...this.stringifyMany(values))
  }

  async remove(value: NativeType<T>) {
    await this.getClient().srem(this.key, this.stringify(value))
  }

  async has(value: NativeType<T>) {
    const res = await this.getClient().sismember(
      this.key,
      this.stringify(value),
    )

    return !!res
  }

  async values() {
    const values = await this.getClient().smembers(this.key)

    return this.parseMany(values)
  }

  async size() {
    return this.getClient().scard(this.key)
  }

  async clear() {
    await this.getClient().del(this.key)
  }
}

export const useSet = <T extends TypeLabel>(opts: AtonalSetOptions<T>) =>
  new AtonalSet(opts)
