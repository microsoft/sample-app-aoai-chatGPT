import { FieldValues } from 'react-hook-form'
import { BrioNode } from '../../types'

const currentIds = (subNodes: BrioNode[]): string[] => {
  const ids: Array<string | string[]> = []

  for (const node of subNodes) {
    if (node.subNodes?.length) {
      ids.push(currentIds(node.subNodes).flat())
      continue
    }

    // Whitelist inputs
    if (
      ![
        'ButtonSwitchYesNo',
        'CheckBox',
        'CheckBoxMulti',
        'Date',
        'Decimal',
        'DropDownList',
        'DropDownListAddMore',
        'DropDownListMulti',
        'DropDownListYesNo',
        'IntPositive',
        'RadioButtons',
        'RadioButtonsYesNo',
        'TextArea',
        'TextBox',
      ].includes(node.nodeType)
    ) {
      continue
    }

    ids.push(node.id)
  }

  return ids.flat()
}

export const filterTrapetsValues = (
  fieldValues: FieldValues,
  subNodes?: BrioNode[],
): Record<string, string> => {
  if (!subNodes?.length) {
    throw new Error('Invalid subnodes')
  }

  const ids = currentIds(subNodes)
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(fieldValues)) {
    if (!ids.includes(key)) continue
    result[key] = value
  }

  return result
}
