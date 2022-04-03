import { MongoModel } from './mongo'
import { RedisModel, RedisValueType } from './redis'

export class InitableModel<T> {
  private _client?: T

  protected async _init(client: T) {
    if (this._client) {
      throw new Error('already initialized')
    }

    this._client = client
  }

  protected get client() {
    if (!this._client) {
      throw new Error('need initialize first')
    }

    return this._client
  }
}

export interface MultiModel {
  [key: string]: MongoModel | RedisModel<RedisValueType> | MultiModel
}

export type DBModel = MongoModel | RedisModel<RedisValueType> | MultiModel

export const useMultiModel = <T extends MultiModel>(models: T) => models
