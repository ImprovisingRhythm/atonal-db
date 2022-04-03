import ms from 'ms'

export const getRedisTime = (time: string | number) => {
  if (typeof time === 'string') {
    return Math.floor(ms(time) / 1000)
  }

  return time
}
