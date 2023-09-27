export const isStringWithLength = (value: any): value is string =>
  typeof value === 'string' && !!value.length
