import { FlexRow, Icon, IconDef, SvgComponent } from '@carnegie/duplo'
import { FC } from 'react'

type Props = {
  icon: IconDef | SvgComponent
  label: string
}

export const LanguageSwitchItem: FC<Props> = ({ icon, label }) => (
  <FlexRow alignItems="center" gap={6}>
    <Icon icon={icon} />
    {label}
  </FlexRow>
)
