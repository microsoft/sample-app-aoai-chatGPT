import { Heading3 } from '@carnegie/duplo'
import { FC } from 'react'

type Props = {
  title: string
}

export const LoginTitle: FC<Props> = ({ title }) => (
  <Heading3 textAlign="center" pb={16}>
    {title}
  </Heading3>
)
