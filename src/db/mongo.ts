import { MongoClient } from 'mongodb'

export class MongoModel {
  private client?: MongoClient

  protected _init(client: MongoClient) {
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

export interface MongoConfig {
  url: string
}

export const useMongo = ({ url }: MongoConfig) => {
  return new MongoClient(url).connect()
}
