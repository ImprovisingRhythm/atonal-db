import { Redis } from 'ioredis'
import { MongoClient } from 'mongodb'
import { MongoModel } from './mongo'
import { RedisModel, RedisValueType } from './redis'

export class InitableModel<T> {
  private client?: T

  protected _init(client: T) {
    if (this.client) {
      throw new Error('already initialized')
    }

    this.client = client
  }

  protected getClient() {
    if (!this.client) {
      throw new Error('need initialize first')
    }

    return this.client
  }
}

export interface MultiModel {
  [key: string]:
    | MongoModel
    | RedisModel<RedisValueType>
    | LazyModel
    | MultiModel
}

export type DBModel =
  | MongoModel
  | RedisModel<RedisValueType>
  | LazyModel
  | MultiModel

export const useMultiModel = <T extends MultiModel>(models: T) => models

export class LazyModel<T extends InitableModel<any> = InitableModel<any>> {
  private client: Redis | MongoClient | undefined

  constructor(private readonly cb: (name: string) => T) {}

  protected _init(client: Redis | MongoClient) {
    this.client = client
  }

  async getInstance(name: string) {
    const model = this.cb(name)

    if (!this.client) {
      throw new Error('Client is not initialized')
    }

    // @ts-ignore
    model._init(this.client)

    return model
  }
}

export const useLazyModel = <T extends InitableModel<any>>(
  cb: (name: string) => T,
) => {
  return new LazyModel(cb)
}
