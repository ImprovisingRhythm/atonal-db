import { MongoClient } from 'mongodb'
import { InitableModel } from './model'

export { ObjectId } from 'mongodb'

export class MongoModel extends InitableModel<MongoClient> {}

export interface MongoConfig {
  url: string
}

export const useMongo = ({ url }: MongoConfig) => {
  return new MongoClient(url).connect()
}
