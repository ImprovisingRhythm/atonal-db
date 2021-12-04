import { Redis } from 'ioredis'
import { NativeType, RedisModel, TypeLabel } from '../db/redis'

export interface AtonalListOptions<T extends TypeLabel> {
  name: string
  type: T
  defaultValues?: NativeType<T>[]
}

export class AtonalList<T extends TypeLabel> extends RedisModel<T> {
  constructor(private opts: AtonalListOptions<T>) {
    super(opts.name, opts.type)
  }

  async _init(client: Redis) {
    super._init(client)

    if (this.opts.defaultValues) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.push(...this.opts.defaultValues)
      }
    }
  }

  async at(index: number) {
    const value = await this.getClient().lindex(this.key, index)

    return this.parse(value)
  }

  async indexOf(value: NativeType<T>) {
    const index = await this.getClient().lpos(this.key, this.stringify(value))

    if (index === null) {
      return -1
    }

    return index
  }

  async length() {
    return this.getClient().llen(this.key)
  }

  async values() {
    const values = await this.getClient().lrange(this.key, 0, -1)

    return this.parseMany(values)
  }

  async slice(start: number, end?: number) {
    const values = await this.getClient().lrange(
      this.key,
      start,
      end ? end - 1 : -1,
    )

    return this.parseMany(values)
  }

  async push(...values: NativeType<T>[]) {
    return this.getClient().rpush(this.key, ...this.stringifyMany(values))
  }

  async pop() {
    return this.getClient().rpop(this.key)
  }

  async unshift(...values: NativeType<T>[]) {
    return this.getClient().lpush(this.key, ...this.stringifyMany(values))
  }

  async shift() {
    const value = await this.getClient().lpop(this.key)

    return this.parse(value)
  }

  async removeFirst(value: NativeType<T>) {
    await this.getClient().lrem(this.key, 1, this.stringify(value))
  }

  async removeAll(value: NativeType<T>) {
    await this.getClient().lrem(this.key, 0, this.stringify(value))
  }

  async clear() {
    await this.getClient().del(this.key)
  }
}

export const useList = <T extends TypeLabel>(opts: AtonalListOptions<T>) =>
  new AtonalList(opts)
