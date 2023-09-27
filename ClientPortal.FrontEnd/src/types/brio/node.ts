import { BrioCondition } from './condition'

export type BrioNode = {
  id: string
  nodeType: BrioNodeType

  condition?: BrioCondition
  helpText?: React.ReactNode
  helpTitle?: string
  options?: BrioNodeOption[]
  questionId?: string
  readOnly?: boolean
  subNodes?: BrioNode[]
  text?: string
  value?: BrioNodeValue
  defaultValue?: BrioNodeValue
}

export type BrioNodeOption = {
  id: string
  text: string
}

export type BrioNodeOptions = { options: BrioNodeOption[] }

export type BrioNodeValue = string | number | boolean | null | string[]

export type BrioNodeType =
  // Inputs
  | 'ButtonSwitchYesNo' // Carnegie
  | 'CheckBox'
  | 'CheckBoxMulti'
  | 'Date'
  | 'Decimal'
  | 'DropDownList'
  | 'DropDownListAddMore' // Carnegie
  | 'DropDownListMulti'
  | 'DropDownListYesNo'
  | 'IntPositive'
  | 'RadioButtons'
  | 'RadioButtonsYesNo'
  | 'TextArea'
  | 'TextBox'

  // Ideas for new input types
  // | 'Autocomplete'
  // | 'ButtonSwitch'

  // Typography
  | 'H3'
  | 'H4'
  | 'H5'
  | 'Hyperlink'
  | 'Paragraph'
  | 'Popover'

  // Bootstrap Grid
  | 'Col'
  | 'Row'

  // Table
  | 'Table'
  | 'Thead'
  | 'Th'
  | 'Tbody'
  | 'Td'
  | 'Tr'

  // Other
  | 'Div'
  | 'FileLink'
  | 'FileUploader'
  | 'ListItem' // Carnegie
  | 'RemoveRowButton'
  | 'Segment' // Carnegie
