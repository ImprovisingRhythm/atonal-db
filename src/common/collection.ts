import { chain, map, reduce } from 'lodash'
import { isNotEmpty, isNullOrUndefined } from './helper'

const traversalGetHelper = (
  obj: { [key: string]: any },
  paths: string[],
): any => {
  if (isNullOrUndefined(obj) || !isNotEmpty(paths)) {
    return obj
  }

  const current = obj[paths.shift()]

  if (Array.isArray(current)) {
    return chain(current)
      .map(x => traversalGetHelper(x, [...paths]))
      .compact()
      .value()
  }

  return traversalGetHelper(current, paths)
}

export const traversalGet = <T>(obj: { [key: string]: any }, path: string): T =>
  traversalGetHelper(obj, path.split('.'))

export const arrayToMap = <T extends { [key: string]: any }>(
  arr: T[],
  key: keyof T,
) =>
  reduce(
    arr,
    (mapRef, item) => mapRef.set(String(item[key]), item),
    new Map<string, T>(),
  )

const traversalReplaceHelper = (
  data: { [key: string]: any },
  sourceMap: Map<string, any>,
  path: string[],
): any => {
  if (path.length === 1) {
    if (!isNullOrUndefined(data[path[0]])) {
      if (Array.isArray(data[path[0]])) {
        data[path[0]] = map(data[path[0]], item => sourceMap.get(String(item)))
      } else {
        data[path[0]] = sourceMap.get(String(data[path[0]]))
      }
    }
  } else if (isNotEmpty(path)) {
    const current = data[path.shift()]

    if (!isNullOrUndefined(current)) {
      if (Array.isArray(current)) {
        for (const item of current) {
          traversalReplaceHelper(item, sourceMap, [...path])
        }
      } else {
        traversalReplaceHelper(current, sourceMap, path)
      }
    }
  }
}

export const traversalReplace = <T>(
  data: { [key: string]: any },
  sourceMap: Map<string, any>,
  path: string,
): T => traversalReplaceHelper(data, sourceMap, path.split('.'))
