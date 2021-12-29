import { Redis } from 'ioredis'
import { MongoClient } from 'mongodb'
import { DBModel } from './db/model'
import { MongoConfig, MongoModel, useMongo } from './db/mongo'
import { RedisConfig, RedisModel, useRedis } from './db/redis'

export * from './common/collection'
export * from './common/regex-search'
export * from './db/model'
export * from './db/mongo'
export * from './db/redis'
export * from './models/collection'
export * from './models/kv'
export * from './models/list'
export * from './models/map'
export * from './models/set'
export * from './models/value'

export interface AtonalDBConfig {
  databases: {
    mongodb?: MongoConfig
    redis?: RedisConfig
  }
  models?: DBModel[]
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

  const getMongoClient = () => {
    if (!mongoClient) {
      throw new Error('MongoClient is not initialized')
    }

    return mongoClient
  }

  const getRedisClient = () => {
    if (!redisClient) {
      throw new Error('RedisClient is not initialized')
    }

    return redisClient
  }

  const initModels = (models: DBModel[]) => {
    for (const model of models) {
      if (model instanceof MongoModel) {
        // @ts-ignore
        model._init(getMongoClient())
      } else if (model instanceof RedisModel) {
        // @ts-ignore
        model._init(getRedisClient())
      } else {
        initModels(Object.values(model))
      }
    }
  }

  initModels(models)

  return {
    getMongoClient,
    getRedisClient,
  }
}
