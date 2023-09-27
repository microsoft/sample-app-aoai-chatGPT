import { FlexCol, ListItem, ListItemRow, Segment, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { BrioNode as BrioNodeProps, FormState } from '../../../types'
import { decodeBase64 } from '../../../utils/base64'
import { verifyCondition } from '../../../utils/trapets'

type Props = BrioNodeProps & {
  formState?: FormState
}

export const BrioReadNode: FC<Props> = props => {
  const { t } = useTranslation('brio')

  switch (props.nodeType) {
    // Input with value

    case 'Date':
    case 'Decimal':
    case 'IntPositive':
    case 'TextArea':
    case 'TextBox':
      return (
        <FlexCol>
          <Text variant="support1" mb={4}>
            {props.text}
          </Text>

          <Text variant="subtitle2">
            {props.value ? (
              props.value
            ) : (
              <Text variant="subtitle2" color="bunker-20">
                N/A
              </Text>
            )}
          </Text>
        </FlexCol>
      )

    // Input with boolean value

    case 'CheckBox':
      return (
        <FlexCol>
          <Text variant="support1" mb={4}>
            {props.text}
          </Text>
          {props.value !== undefined ? (
            <Text variant="subtitle2">{props.value ? t('#Yes#') : t('#No#')}</Text>
          ) : (
            <Text key={0} variant="subtitle2">
              {props.defaultValue ? t(props.defaultValue as any) : t('#No#')}
            </Text>
          )}
        </FlexCol>
      )

    // Input with one options value

    case 'DropDownList':
    case 'RadioButtons':
      return (
        <FlexCol>
          <Text variant="support1" mb={4}>
            {props.text}
          </Text>

          <Text variant="subtitle2">
            {props.options?.find(x => x.id === props.value)?.text || (
              <Text variant="subtitle2" color="bunker-20">
                N/A
              </Text>
            )}
          </Text>
        </FlexCol>
      )

    // Input with translated options value

    case 'ButtonSwitchYesNo':
    case 'DropDownListYesNo':
    case 'RadioButtonsYesNo':
      return (
        <FlexCol>
          <Text variant="support1" mb={4}>
            {props.text}
          </Text>

          <Text variant="subtitle2">
            {t(props.options?.find(x => x.id === props.value)?.text as any) ||
              (props.defaultValue ? (
                <Text variant="subtitle2">{t(props.defaultValue as any)}</Text>
              ) : (
                <Text variant="subtitle2" color="bunker-20">
                  N/A
                </Text>
              ))}
          </Text>
        </FlexCol>
      )

    // Input with multiple options value

    case 'CheckBoxMulti':
    case 'DropDownListAddMore':
    case 'DropDownListMulti':
      return (
        <FlexCol>
          <Text variant="support1" mb={4}>
            {props.text}
          </Text>

          {...props.options && Array.isArray(props.value) && props.value.length
            ? props.options
                .filter(x => Array.isArray(props.value) && props.value.includes(x.id))
                .map((x, i) => (
                  <Text key={i} variant="subtitle2">
                    {x.text}
                  </Text>
                ))
            : [
                <>
                  {props.defaultValue ? (
                    <Text key={0} variant="subtitle2">
                      {t(props.defaultValue as any)}
                    </Text>
                  ) : (
                    <Text key={0} variant="subtitle2" color="bunker-20">
                      N/A
                    </Text>
                  )}
                </>,
              ]}
        </FlexCol>
      )

    // Typography

    case 'H3':
      return null

    case 'Hyperlink':
      return (
        <FlexCol>
          <Text variant="support1" mb={4}>
            {props.text}
          </Text>

          <a href={decodeBase64(props.id)} target="_blank" rel="noreferrer">
            <Text variant="subtitle2">{props.value}</Text>
          </a>
        </FlexCol>
      )

    case 'H4':
    case 'H5':
    case 'Paragraph':
      return <Text variant="support1">{props.text}</Text>

    // Other

    case 'Div':
      return (
        <>
          {verifyCondition(props.formState || {}, props.condition) && (
            <FlexCol gap={16}>
              {props.subNodes?.map(subNode => (
                <BrioReadNode key={subNode.id} formState={props.formState} {...subNode} />
              ))}
            </FlexCol>
          )}
        </>
      )

    case 'ListItem':
      return (
        <ListItem divider noDividerOffset>
          <ListItemRow
            title={<Text variant="support1">{props.text}</Text>}
            value={<Text variant="subtitle2">{props.value}</Text>}
          />
        </ListItem>
      )

    case 'Segment':
      return (
        <FlexCol>
          <Text variant="support1" mb={12}>
            {props.text}
          </Text>

          <Segment title={decodeBase64(props.id)} noContentPadding headingVariant="overline" mb={8}>
            {props.subNodes?.map(subNode => (
              <BrioReadNode key={subNode.id} formState={props.formState} {...subNode} />
            ))}
          </Segment>
        </FlexCol>
      )

    default:
      return <></>
  }
}
