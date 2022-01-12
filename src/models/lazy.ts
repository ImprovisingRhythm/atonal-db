import { RedisModel, RedisValueType } from '../db/redis'

export interface AtonalLazyOptions<T extends RedisModel<RedisValueType>> {
  name: string
  builder: (key: string) => T
}

export class AtonalLazy<
  T extends RedisModel<RedisValueType>,
> extends RedisModel<'string'> {
  constructor(private readonly opts: AtonalLazyOptions<T>) {
    super(opts.name, 'string')
  }

  async get(key: string) {
    const client = this.getClient()
    const model = this.opts.builder(`${this.key}:${key}`)

    // @ts-ignore
    await model._init(client)

    return model
  }
}

export const useLazy = <T extends RedisModel<RedisValueType>>(
  opts: AtonalLazyOptions<T>,
) => new AtonalLazy(opts)
