import { FlexCol } from '@carnegie/duplo'
import { FC } from 'react'
import { LoginInfoListItem } from './LoginInfoListItem'

type Props = {
  items: string[]
}

export const LoginInfoList: FC<Props> = ({ items }) => (
  <FlexCol gap={16}>
    {items.map((x, i) => (
      <LoginInfoListItem key={i} heading={x} step={i + 1} />
    ))}
  </FlexCol>
)
