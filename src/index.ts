import { Redis } from 'ioredis'
import { MongoClient } from 'mongodb'
import { MongoConfig, MongoModel, useMongo } from './db/mongo'
import { RedisConfig, RedisModel, useRedis } from './db/redis'

export * from './db/mongo'
export * from './db/redis'
export * from './models/collection'
export * from './models/list'
export * from './models/set'

export interface AtonalDBConfig {
  databases: {
    mongodb?: MongoConfig
    redis?: RedisConfig
  }
  models?: Array<MongoModel | RedisModel>
}

export const useDB = async ({ databases, models = [] }: AtonalDBConfig) => {
  let mongoClient: MongoClient | undefined
  let redisClient: Redis | undefined

  if (databases.mongodb) {
    mongoClient = await useMongo(databases.mongodb)
  }

  if (databases.redis) {
    redisClient = await useRedis(databases.redis)
  }

  for (const model of models) {
    if (model instanceof MongoModel) {
      if (!mongoClient) {
        throw new Error('require mongodb config')
      }

      // @ts-ignore
      model._init(mongoClient)
    } else if (model instanceof RedisModel) {
      if (!redisClient) {
        throw new Error('require redis config')
      }

      // @ts-ignore
      model._init(redisClient)
    } else {
      throw new Error('unrecognized model type')
    }
  }
}
