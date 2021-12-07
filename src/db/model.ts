import { MongoModel } from './mongo'
import { RedisModel } from './redis'

export interface MultiModel {
  [key: string]: MongoModel | RedisModel<any> | MultiModel
}

export type DBModel = MongoModel | RedisModel<any> | MultiModel

export const useMultiModel = <T extends MultiModel>(models: T) => models
