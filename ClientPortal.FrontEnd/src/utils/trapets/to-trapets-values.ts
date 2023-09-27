import { FieldValues } from 'react-hook-form'

const convert = (item: any): string => {
  if (item === undefined) return ''
  if (item === null) return ''
  if (item === true) return 'True'
  if (item === false) return 'False'

  if (typeof item === 'string') return item
  if (Array.isArray(item)) return item.join(';')
  if (item instanceof Date) return item.toISOString().slice(0, 10)
  if (typeof item.toString === 'function') return item.toString()

  try {
    return JSON.stringify(item)
  } catch (_) {
    return `${item}`
  }
}

export const toTrapetsValues = (values: FieldValues): Record<string, string> => {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(values)) {
    result[key] = convert(value)
  }

  return result
}
