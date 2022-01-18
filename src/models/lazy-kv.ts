import { getRedisTime, RedisModel, RedisValueType } from '../db/redis'

export interface AtonalLazyKVOptions<T extends RedisModel<RedisValueType>> {
  name: string
  builder: (name: string) => T
}

export class AtonalLazyKV<
  T extends RedisModel<RedisValueType>,
> extends RedisModel<'string'> {
  constructor(private readonly opts: AtonalLazyKVOptions<T>) {
    super(opts.name, 'string')
  }

  async get(key: string) {
    const client = this.getClient()
    const model = this.opts.builder(`${this.key}:${key}`)

    // @ts-ignore
    await model._init(client)

    return model
  }

  async remove(key: string) {
    await this.getClient().del(`${this.key}:${key}`)
  }

  async has(key: string) {
    const res = await this.getClient().exists(`${this.key}:${key}`)
    return !!res
  }

  async expire(key: string, expiresIn: string | number) {
    return this.getClient().expire(
      `${this.key}:${key}`,
      getRedisTime(expiresIn),
    )
  }

  async ttl(key: string) {
    return this.getClient().ttl(`${this.key}:${key}`)
  }
}

export const useLazyKV = <T extends RedisModel<RedisValueType>>(
  opts: AtonalLazyKVOptions<T>,
) => new AtonalLazyKV(opts)
