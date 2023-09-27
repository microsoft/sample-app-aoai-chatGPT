import {
  FlexRow,
  Heading4,
  Heading5,
  Heading6,
  IconButton,
  IconInfoOutlined,
  SideDrawer,
} from '@carnegie/duplo'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrioNode } from '../../../types'

type Props = Pick<BrioNode, 'helpText' | 'text' | 'nodeType'>

const HeadingSwitch: FC<Props> = ({ text, nodeType }) => {
  switch (nodeType) {
    case 'H3':
      return <Heading4>{text}</Heading4>

    case 'H4':
      return <Heading5>{text}</Heading5>

    case 'H5':
      return <Heading6>{text}</Heading6>

    default:
      return <></>
  }
}

export const BrioInputHeading: FC<Props> = ({ helpText, text, nodeType }) => {
  const { t } = useTranslation('brio')
  const [open, setOpen] = useState<boolean>(false)

  if (!text) return <></>

  return (
    <>
      <FlexRow minHeight={24} alignItems="center" justifyContent="space-between">
        <HeadingSwitch text={text} nodeType={nodeType} />
        {helpText && (
          <IconButton
            icon={IconInfoOutlined}
            color={'icon-default'}
            onClick={() => setOpen(true)}
            size="small"
            variant="uncontained"
          />
        )}
      </FlexRow>
      {helpText && (
        <SideDrawer
          title={t('helpDrawer.title')}
          variant="slide"
          sidebarContent={helpText}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
