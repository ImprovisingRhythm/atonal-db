import { getRedisTime } from '../common/time'
import { RedisModel, RedisValueType } from '../db/redis'

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
    const model = this.opts.builder(`${this.key}:${key}`)

    // @ts-ignore
    await model._init(this.client)

    return model
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
}

export const useLazyKV = <T extends RedisModel<RedisValueType>>(
  opts: AtonalLazyKVOptions<T>,
) => new AtonalLazyKV(opts)
