/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  BrioCondition,
  BrioConditionStatement,
  BrioConditionValue,
  BrioConditionValueType,
  BrioNodeValue,
  FormState,
} from '../../types'

const assertValueType = (
  rhs: BrioConditionValue | undefined,
  valueType: BrioConditionValueType,
): void => {
  if (rhs === undefined) {
    throw new Error('Missing param value [ rhs ]')
  }

  switch (valueType) {
    case 'Bool':
      if (typeof rhs === 'boolean') return
      break

    case 'Decimal':
    case 'Number':
      if (typeof rhs === 'number') return
      break

    case 'Option':
    case 'Text':
      if (typeof rhs === 'string') return
      break

    default:
      throw new Error(`Invalid param value [ valueType: ${valueType} ]`)
  }

  throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
}

const resolveCondition = (state: FormState, statement: BrioConditionStatement) => {
  const { returnValue, statements } = statement

  if (statements?.length) {
    return resolveStatements(state, statements)
  }
  if (returnValue !== undefined) {
    return returnValue === 'True'
  }

  throw new Error(`Unable to resolve condition [ ${JSON.stringify(statement)} ] `)
}

const opContains = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => {
  if (!Array.isArray(lhs)) {
    throw new Error(`Invalid param type [ lhs: ${typeof lhs} ]`)
  }
  if (typeof rhs !== 'string') {
    throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
  }

  return lhs.includes(rhs)
}

const opContainsAllOf = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => {
  if (!Array.isArray(lhs)) {
    throw new Error(`Invalid param type [ lhs: ${typeof lhs} ]`)
  }
  if (typeof rhs !== 'string') {
    throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
  }

  const rhsArray = rhs.split(';')

  return rhsArray.every(x => lhs.includes(x))
}

const opContainsAnyOf = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => {
  if (!Array.isArray(lhs)) {
    throw new Error(`Invalid param type [ lhs: ${typeof lhs} ]`)
  }
  if (typeof rhs !== 'string') {
    throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
  }

  const rhsArray = rhs.split(';')

  return rhsArray.some(x => lhs.includes(x))
}

const opEquals = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => {
  if (Array.isArray(lhs)) {
    if (typeof rhs !== 'string') {
      throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
    }

    return lhs.includes(rhs)
  }

  return lhs === rhs
}

const opGreaterThan = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => {
  if (typeof lhs !== 'number') {
    throw new Error(`Invalid param type [ lhs: ${typeof lhs} ]`)
  }
  if (typeof rhs !== 'number') {
    throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
  }

  return lhs > rhs
}

const opGreaterThanOrEqualTo = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => {
  if (typeof lhs !== 'number') {
    throw new Error(`Invalid param type [ lhs: ${typeof lhs} ]`)
  }
  if (typeof rhs !== 'number') {
    throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
  }

  return lhs >= rhs
}

const opIsEmpty = (lhs: BrioNodeValue): boolean =>
  !!(lhs === undefined || lhs === null || lhs === '' || (Array.isArray(lhs) && !lhs.length))

const opIsNotEmpty = (lhs: BrioNodeValue): boolean => !opIsEmpty(lhs)

const opLessThan = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => {
  if (typeof lhs !== 'number') {
    throw new Error(`Invalid param type [ lhs: ${typeof lhs} ]`)
  }
  if (typeof rhs !== 'number') {
    throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
  }

  return lhs < rhs
}

const opLessThanOrEqualTo = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => {
  if (typeof lhs !== 'number') {
    throw new Error(`Invalid param type [ lhs: ${typeof lhs} ]`)
  }
  if (typeof rhs !== 'number') {
    throw new Error(`Invalid param type [ rhs: ${typeof rhs} ]`)
  }

  return lhs <= rhs
}

const opNotEquals = (lhs: BrioNodeValue, rhs: BrioConditionValue): boolean => !opEquals(lhs, rhs)

const resolveStatement = (state: FormState, statement: BrioConditionStatement): boolean => {
  const { lhs, rhs, op, returnValue, statements, valueType } = statement

  if (!lhs && statements?.length) {
    return resolveStatements(state, statements)
  }
  if (!lhs && returnValue !== undefined) {
    return returnValue === 'True'
  }

  if (!lhs) {
    throw new Error('Missing param [ lhs ]')
  }
  if (!op) {
    throw new Error('Missing param [ op ]')
  }
  if (!valueType) {
    throw new Error('Missing param [ valueType ]')
  }

  switch (op) {
    case 'Contains':
    case 'ContainsAnyOf':
    case 'ContainsAllOf':
    case 'Equals':
    case 'GreaterThan':
    case 'GreaterThanOrEqualTo':
    case 'In':
    case 'LessThan':
    case 'LessThanOrEqualTo':
    case 'NotEquals':
      assertValueType(rhs, valueType)
      break

    default:
      break
  }

  const lhsValue = state[lhs] !== undefined && state[lhs] !== null ? state[lhs] : ''

  switch (op) {
    case 'Contains':
      if (opContains(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'ContainsAnyOf':
      if (opContainsAnyOf(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'ContainsAllOf':
      if (opContainsAllOf(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'Equals':
      if (opEquals(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'GreaterThan':
      if (opGreaterThan(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'GreaterThanOrEqualTo':
      if (opGreaterThanOrEqualTo(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'IsEmpty':
      if (opIsEmpty(lhsValue)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'IsNotEmpty':
      if (opIsNotEmpty(lhsValue)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'LessThan':
      if (opLessThan(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'LessThanOrEqualTo':
      if (opLessThanOrEqualTo(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    case 'NotEquals':
      if (opNotEquals(lhsValue, rhs!)) {
        return resolveCondition(state, statement)
      }
      return false

    default:
      throw new Error(`Invalid param value [ op: ${op} ]`)
  }
}

const resolveStatements = (state: FormState, statements: BrioConditionStatement[]): boolean =>
  statements.map(statement => resolveStatement(state, statement)).some(x => x === true)

export const verifyCondition = (state: FormState, condition?: BrioCondition): boolean => {
  try {
    return !condition || resolveStatements(state, [condition])
  } catch (err) {
    return false
  }
}
