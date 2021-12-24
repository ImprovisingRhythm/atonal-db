import { MongoModel } from './mongo'
import { RedisModel, RedisType } from './redis'

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
  [key: string]: MongoModel | RedisModel<RedisType> | MultiModel
}

export type DBModel = MongoModel | RedisModel<RedisType> | MultiModel

export const useMultiModel = <T extends MultiModel>(models: T) => models
