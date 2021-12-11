import { flatMap } from 'lodash'
import {
  AggregateOptions,
  Document,
  InsertOneOptions,
  ObjectId,
  OptionalId,
  SchemaMember,
  BulkWriteOptions,
  CreateIndexesOptions,
  Filter,
  UpdateFilter,
  UpdateOptions,
  FindOneAndUpdateOptions,
  DeleteOptions,
  FindOneAndDeleteOptions,
  CountDocumentsOptions,
  EstimatedDocumentCountOptions,
  FindOptions,
  MongoClient,
} from 'mongodb'
import {
  arrayToMap,
  traversalGet,
  traversalReplace,
} from '../common/collection'
import { ArrayOr, isEmpty, isNotEmpty, PromiseOr } from '../common/helper'
import { MongoModel } from '../db/mongo'

export type IndexKeys<Model extends BaseModel> = Record<
  keyof Partial<Model> | string,
  1 | -1 | '2d' | '2dsphere'
>

export type Index<Model extends BaseModel> =
  | [IndexKeys<Model>, CreateIndexesOptions]
  | IndexKeys<Model>

export type Ref<Model extends BaseModel> = Model | ObjectId

export interface BaseModel {
  _id: ObjectId
}

export interface Timestamps {
  createdAt: Date
  updatedAt: Date
}

export type NewDocument<T extends OmitRef<BaseModel>> = Omit<
  OptionalId<T>,
  keyof Timestamps
> &
  Partial<Timestamps>

export interface ExtraUpdateOptions {
  timestamps?: boolean
}

export type Projection<T extends BaseModel> = SchemaMember<
  T,
  Document | number | boolean
>

export interface PopulateItem<
  Model extends BaseModel,
  RefModel extends BaseModel,
> {
  model: AtonalCollection<RefModel>
  path: ModelKeys<Model>
  select?: ModelKeys<RefModel>[]
  pipe?: (docs: RefModel[]) => PromiseOr<void>
}

export type ModelKeys<T extends BaseModel> = Exclude<keyof T, number | symbol>

export type OmitRef<T extends BaseModel> = {
  [K in keyof T]: T[K] extends Ref<BaseModel> | undefined
    ? ObjectId
    : T[K] extends Ref<BaseModel>[] | undefined
    ? ObjectId[]
    : T[K]
}

export type Populated<T extends BaseModel> = {
  [K in keyof T]: T[K] extends ObjectId
    ? ObjectId
    : T[K] extends Ref<infer X> | undefined
    ? X
    : T[K] extends Ref<infer X>[] | undefined
    ? X[]
    : T[K]
}

export interface AtonalCollectionOptions<Model extends BaseModel> {
  name: string
  sync?: boolean
  indexes?: Index<Model>[]
  timestamps?: boolean
}

export class AtonalCollection<
  Model extends BaseModel,
  FlatModel extends OmitRef<Model> = OmitRef<Model>,
> extends MongoModel {
  constructor(private readonly opts: AtonalCollectionOptions<Model>) {
    super()
  }

  protected async _init(client: MongoClient) {
    super._init(client)

    if (this.opts.sync) {
      await this.syncIndexes()
    }
  }

  initializeOrderedBulkOp(opts?: BulkWriteOptions) {
    return this.collection.initializeOrderedBulkOp(opts)
  }

  initializeUnorderedBulkOp(opts?: BulkWriteOptions) {
    return this.collection.initializeUnorderedBulkOp(opts)
  }

  aggregate(pipeline: object[], opts?: AggregateOptions) {
    return this.collection.aggregate(pipeline, opts)
  }

  async create(doc: NewDocument<FlatModel>, opts: InsertOneOptions = {}) {
    if (this.opts.timestamps) {
      const now = new Date()

      if (!doc.hasOwnProperty('createdAt')) {
        Object.assign(doc, { createdAt: now })
      }

      if (!doc.hasOwnProperty('updatedAt')) {
        Object.assign(doc, { updatedAt: now })
      }
    }

    await this.collection.insertOne(doc as unknown as OptionalId<Model>, opts)

    return doc as unknown as Model
  }

  async createMany(
    docs: NewDocument<FlatModel>[],
    opts: BulkWriteOptions = {},
  ) {
    if (this.opts.timestamps) {
      const now = new Date()

      for (const doc of docs) {
        if (!doc.hasOwnProperty('createdAt')) {
          Object.assign(doc, { createdAt: now })
        }

        if (!doc.hasOwnProperty('updatedAt')) {
          Object.assign(doc, { updatedAt: now })
        }
      }
    }

    await this.collection.insertMany(
      docs as unknown as OptionalId<Model>[],
      opts,
    )

    return docs as unknown as Model[]
  }

  find(filter: Filter<FlatModel> = {}, opts: FindOptions<FlatModel> = {}) {
    return this.collection.find(filter as Filter<Model>, opts)
  }

  async findOne(filter: Filter<FlatModel>, opts: FindOptions<FlatModel> = {}) {
    return this.collection.findOne(filter as Filter<Model>, opts)
  }

  async findById(_id: ObjectId, opts: FindOptions<FlatModel> = {}) {
    return this.findOne({ _id }, opts)
  }

  async exists(cond: ArrayOr<ObjectId> | Filter<FlatModel>) {
    if (Array.isArray(cond)) {
      const items = await this.find(
        { _id: { $in: cond as any[] } },
        { projection: { _id: 1 } },
      ).toArray()

      return items.length === cond.length
    } else if (cond instanceof ObjectId) {
      const item = await this.findById(cond, {
        projection: { _id: 1 },
      })

      return item !== null
    } else {
      const item = await this.findOne(cond, {
        projection: { _id: 1 },
      })

      return item !== null
    }
  }

  async updateOne(
    filter: Filter<FlatModel>,
    update: UpdateFilter<FlatModel>,
    { timestamps = true, ...opts }: UpdateOptions & ExtraUpdateOptions = {},
  ) {
    if (this.opts.timestamps && timestamps) {
      this.updateTimestamps(update)
    }

    return this.collection.updateOne(
      filter as Filter<Model>,
      update as UpdateFilter<Model>,
      opts,
    )
  }

  async updateById(
    _id: ObjectId,
    update: UpdateFilter<FlatModel>,
    opts: UpdateOptions & ExtraUpdateOptions = {},
  ) {
    return this.updateOne({ _id }, update, opts)
  }

  async updateMany(
    filter: Filter<FlatModel>,
    update: UpdateFilter<FlatModel>,
    { timestamps = true, ...opts }: UpdateOptions & ExtraUpdateOptions = {},
  ) {
    if (this.opts.timestamps && timestamps) {
      this.updateTimestamps(update)
    }

    return this.collection.updateMany(
      filter as Filter<Model>,
      update as UpdateFilter<Model>,
      opts,
    )
  }

  async findOneAndUpdate(
    filter: Filter<FlatModel>,
    update: UpdateFilter<FlatModel>,
    {
      timestamps = true,
      ...opts
    }: FindOneAndUpdateOptions & ExtraUpdateOptions = {},
  ) {
    if (this.opts.timestamps && timestamps) {
      this.updateTimestamps(update)
    }

    const { value } = await this.collection.findOneAndUpdate(
      filter as Filter<Model>,
      update as UpdateFilter<Model>,
      opts,
    )

    return value
  }

  async findByIdAndUpdate(
    _id: ObjectId,
    update: UpdateFilter<FlatModel>,
    opts: FindOneAndUpdateOptions & ExtraUpdateOptions = {},
  ) {
    return this.findOneAndUpdate({ _id }, update, opts)
  }

  async deleteOne(filter: Filter<FlatModel>, opts: DeleteOptions = {}) {
    return this.collection.deleteOne(filter as Filter<Model>, opts)
  }

  async deleteById(_id: ObjectId, opts: DeleteOptions = {}) {
    return this.deleteOne({ _id }, opts)
  }

  async deleteMany(filter: Filter<FlatModel>, opts: DeleteOptions = {}) {
    return this.collection.deleteMany(filter as Filter<Model>, opts)
  }

  async findOneAndDelete(
    filter: Filter<FlatModel>,
    opts: FindOneAndDeleteOptions = {},
  ) {
    const { value } = await this.collection.findOneAndDelete(
      filter as Filter<Model>,
      opts,
    )

    return value
  }

  async findByIdAndDelete(_id: ObjectId, opts: FindOneAndDeleteOptions = {}) {
    return this.findOneAndDelete({ _id }, opts)
  }

  async countDocuments(
    filter: Filter<FlatModel> = {},
    opts: CountDocumentsOptions = {},
  ) {
    return this.collection.countDocuments(filter as Filter<Model>, opts)
  }

  async estimatedDocumentCount(opts: EstimatedDocumentCountOptions = {}) {
    return this.collection.estimatedDocumentCount(opts)
  }

  async populate(docs: Model[], items: ArrayOr<PopulateItem<Model, any>>) {
    if (isEmpty(docs)) {
      return docs
    }

    // If the "populate" argument is an array, repeatly populate each of them
    if (Array.isArray(items)) {
      for (const item of items) {
        await this.populate(docs, item)
      }

      return docs
    }

    const { model, path, select = [], pipe } = items

    // Traverse all docs to get ref ids based on the "paths"
    const refIds = flatMap(docs, doc => traversalGet<ObjectId>(doc, path))

    if (isEmpty(refIds)) {
      return docs
    }

    const queryBuilder = model.aggregate([])

    // Query for ref docs by their _id
    queryBuilder.match({ _id: { $in: refIds } })

    // If "select" is not empty, transform it into a projection
    if (isNotEmpty(select)) {
      const projection: Projection<any> = {}

      for (const item of select) {
        projection[item] = 1
      }

      queryBuilder.project(projection)
    }

    // Fetch ref docs
    const refDocs = await queryBuilder.toArray()

    // Run the pipeline
    if (pipe) {
      await pipe(refDocs as BaseModel[])
    }

    // Traverse all the docs and replace all ref ids with fetched ref docs
    if (isNotEmpty(refDocs)) {
      const refDocMap = arrayToMap(refDocs, '_id')

      for (const doc of docs) {
        traversalReplace(doc, refDocMap, path)
      }
    }

    return docs
  }

  async syncIndexes() {
    if (!this.opts.indexes) return

    for (const index of this.opts.indexes) {
      if (Array.isArray(index)) {
        const [indexSpec, options = {}] = index

        await this.collection.createIndex(indexSpec, options)
      } else {
        await this.collection.createIndex(index)
      }
    }
  }

  get collection() {
    return this.getClient().db().collection<Model>(this.opts.name)
  }

  private updateTimestamps(update: UpdateFilter<FlatModel>) {
    if (update.$set) {
      if (!update.$set.hasOwnProperty('updatedAt')) {
        Object.assign(update.$set, {
          updatedAt: new Date(),
        })
      }
    } else {
      Object.assign(update, {
        $set: {
          updatedAt: new Date(),
        },
      })
    }
  }
}

export const usePopulateItem = <
  Model extends BaseModel,
  RefModel extends BaseModel,
>(
  item: PopulateItem<Model, RefModel>,
) => item

export const asObjectId = <T extends BaseModel>(ref: Ref<T>) => {
  if (ref instanceof ObjectId) {
    return ref
  }

  return ref._id
}

export const asDoc = <T extends BaseModel>(ref: Ref<T>) => {
  if (ref instanceof ObjectId) {
    return { _id: ref } as T
  }

  return ref
}

export const asPopulated = <T extends BaseModel>(doc: T) => {
  return doc as Populated<T>
}

export const useCollection = <Model extends BaseModel>(
  opts: AtonalCollectionOptions<Model>,
) => new AtonalCollection(opts)
