import { Heading5 } from '@carnegie/duplo'
import { FC } from 'react'

type Props = {
  subtitle: string
}

export const LoginSubtitle: FC<Props> = ({ subtitle }) => (
  <Heading5
    textAlign="center"
    pb={8}
    css={{
      '@media (min-width: 600px)': {
        textAlign: 'left',
      },
    }}
  >
    {subtitle}
  </Heading5>
)
