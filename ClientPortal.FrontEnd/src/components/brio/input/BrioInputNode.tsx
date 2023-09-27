import { DuploSpaces, FlexCol, ListItem, ListItemRow, Paragraph, Text } from '@carnegie/duplo'
import { FC, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { BrioNode as BrioNodeProps, RuleViolations } from '../../../types'
import { verifyCondition } from '../../../utils/trapets'
import { BrioButtonSwitchYesNo } from '../node-types/BrioButtonSwitchYesNo'
import { BrioCheckbox } from '../node-types/BrioCheckbox'
import { BrioCheckboxMulti } from '../node-types/BrioCheckboxMulti'
import { BrioDate } from '../node-types/BrioDate'
import { BrioDropDownList } from '../node-types/BrioDropDownList'
import { BrioDropDownListAddMore } from '../node-types/BrioDropDownListAddMore'
import { BrioDropDownListMulti } from '../node-types/BrioDropDownListMulti'
import { BrioHyperlink } from '../node-types/BrioHyperlink'
import { BrioNumber } from '../node-types/BrioNumber'
import { BrioRadioButtons } from '../node-types/BrioRadioButtons'
import { BrioRadioButtonsYesNo } from '../node-types/BrioRadioButtonsYesNo'
import { BrioSegment } from '../node-types/BrioSegment'
import { BrioTextBox } from '../node-types/BrioTextBox'
import { BrioTextarea } from '../node-types/BrioTextarea'
import { BrioInputHeading } from './BrioInputHeading'

type Custom = {
  gap: DuploSpaces
  padding: DuploSpaces
}

type Props = BrioNodeProps & Partial<RuleViolations> & Partial<Custom>

export const BrioInputNode: FC<Props> = ({
  gap = 16,
  padding = 16,
  ruleViolations = [],
  ...props
}) => {
  const { setError, setValue, watch } = useFormContext()
  const subscription = watch()

  useEffect(() => setValue(props.id, props.value), [props.id, props.value])

  useEffect(() => {
    if (!ruleViolations?.length) return

    const violation = ruleViolations.find(x => x.fieldId === props.id)

    if (!violation) return

    setError(props.id, { message: violation.message })
  }, [props.id, ruleViolations])

  switch (props.nodeType) {
    // Input

    case 'ButtonSwitchYesNo':
      return <BrioButtonSwitchYesNo {...props} />

    case 'CheckBox':
      return <BrioCheckbox {...props} />

    case 'CheckBoxMulti':
      return <BrioCheckboxMulti {...props} />

    case 'Date':
      return <BrioDate {...props} />

    case 'Decimal':
      return <BrioNumber {...props} />

    case 'DropDownList':
      return <BrioDropDownList {...props} />

    case 'DropDownListAddMore':
      return <BrioDropDownListAddMore {...props} />

    case 'DropDownListMulti':
      return <BrioDropDownListMulti {...props} />

    case 'DropDownListYesNo':
      return <BrioButtonSwitchYesNo {...props} />

    case 'IntPositive':
      return <BrioNumber {...props} min={1} />

    case 'RadioButtons':
      return <BrioRadioButtons {...props} />

    case 'RadioButtonsYesNo':
      return <BrioRadioButtonsYesNo {...props} />

    case 'TextArea':
      return <BrioTextarea {...props} />

    case 'TextBox':
      return <BrioTextBox {...props} />

    // Typography

    case 'H3':
    case 'H4':
    case 'H5':
      return <BrioInputHeading {...props} />

    case 'Hyperlink':
      return <BrioHyperlink {...props} />

    case 'Paragraph':
      return <Paragraph>{props.text}</Paragraph>

    // Other

    case 'Div':
      return (
        <>
          {verifyCondition(subscription, props.condition) && (
            <FlexCol backgroundColor="regent-st-100" gap={gap} p={padding} borderRadius={8}>
              {props.subNodes?.map(subNode => (
                <BrioInputNode
                  key={subNode.id}
                  gap={gap}
                  padding={0}
                  ruleViolations={ruleViolations}
                  {...subNode}
                />
              ))}
            </FlexCol>
          )}
        </>
      )

    case 'ListItem':
      return (
        <ListItem divider noDividerOffset>
          <ListItemRow title={<Text>{props.text}</Text>} value={props.value} />
        </ListItem>
      )

    case 'Segment':
      return <BrioSegment {...props} />

    default:
      return <></>
  }
}
