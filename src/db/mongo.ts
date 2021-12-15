import { MongoClient, MongoClientOptions } from 'mongodb'
import { InitableModel } from './model'

export { ObjectId } from 'mongodb'

export class MongoModel extends InitableModel<MongoClient> {}

export interface MongoConfig extends MongoClientOptions {
  url: string
}

export const useMongo = ({ url, ...opts }: MongoConfig) => {
  return new MongoClient(url, opts).connect()
}
