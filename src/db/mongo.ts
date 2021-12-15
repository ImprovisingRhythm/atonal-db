import { MongoClient, MongoClientOptions } from 'mongodb'
import { InitableModel } from './model'

export { ObjectId } from 'mongodb'

export class MongoModel extends InitableModel<MongoClient> {}

export interface MongoConfig {
  url: string
  options: MongoClientOptions
}

export const useMongo = ({ url, options }: MongoConfig) => {
  return new MongoClient(url, options).connect()
}
