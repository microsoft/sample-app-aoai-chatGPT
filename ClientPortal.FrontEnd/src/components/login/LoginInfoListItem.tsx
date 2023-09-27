import { Badge, Flex, Heading6, Text } from '@carnegie/duplo'
import { FC } from 'react'

type Props = {
  heading: string
  step: number
}

export const LoginInfoListItem: FC<Props> = ({ heading, step }) => (
  <Flex gap={16}>
    <Badge size="medium">
      <Text variant="subtitle2">{step}</Text>
    </Badge>
    <Heading6>{heading}</Heading6>
  </Flex>
)
