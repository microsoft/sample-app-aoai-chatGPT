export type BrioCondition = BrioConditionStatement & {
  statements: BrioConditionStatement[]
}

export type BrioConditionStatement = {
  lhs?: string
  rhs?: BrioConditionValue
  op?: BrioConditionOperator
  returnValue?: 'True' | 'False'
  statements?: BrioConditionStatement[]
  valueType?: BrioConditionValueType
}

export type BrioConditionOperator =
  | 'Contains'
  | 'ContainsAllOf'
  | 'ContainsAnyOf'
  | 'Equals'
  | 'GreaterThan'
  | 'GreaterThanOrEqualTo'
  | 'In'
  | 'IsEmpty'
  | 'IsNotEmpty'
  | 'LessThan'
  | 'LessThanOrEqualTo'
  | 'NotEquals'

export type BrioConditionValue = boolean | number | string

export type BrioConditionValueType = 'Bool' | 'Decimal' | 'Number' | 'Option' | 'Text'
