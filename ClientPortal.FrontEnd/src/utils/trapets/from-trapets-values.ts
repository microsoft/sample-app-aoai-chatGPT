import { BrioNode, BrioNodeType, BrioNodeValue, QuestionnaireStartResponse } from '../../types'
import { isStringWithLength } from '../string-operations'

const convertValue = (nodeType: BrioNodeType, value?: BrioNodeValue): BrioNodeValue => {
  if (Array.isArray(value)) return value
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value

  switch (nodeType) {
    // return boolean
    case 'CheckBox':
      if (!isStringWithLength(value)) return null
      return value === 'True' ? true : value === 'False' ? false : null

    // return number
    case 'Decimal':
      if (!isStringWithLength(value)) return null
      return parseFloat(value)

    // return number
    case 'IntPositive':
      if (!isStringWithLength(value)) return null
      return parseInt(value)

    // return string[]
    case 'CheckBoxMulti':
    case 'DropDownListAddMore':
    case 'DropDownListMulti':
      if (!isStringWithLength(value)) return []
      return value.split(';')

    // return string
    default:
      if (!isStringWithLength(value)) return null
      return value
  }
}

export const convertSubnodes = (subNodes: BrioNode[]): BrioNode[] => {
  const result: BrioNode[] = []

  for (const subNode of subNodes) {
    const { subNodes: nestedNodes, value, ...rest } = subNode
    const insert: BrioNode = { ...rest }

    insert.value = convertValue(subNode.nodeType, value)

    if (Array.isArray(nestedNodes)) {
      const converted = convertSubnodes(nestedNodes)
      insert.subNodes = converted
    }

    result.push(insert)
  }

  return result
}

export const fromTrapetsValues = ({
  pageDefinition,
  ...rest
}: QuestionnaireStartResponse): QuestionnaireStartResponse => ({
  pageDefinition: {
    rootNode: {
      subNodes: convertSubnodes(pageDefinition.rootNode.subNodes),
    },
    navigation: pageDefinition.navigation,
    isPreview: pageDefinition.isPreview,
  },
  ...rest,
})
