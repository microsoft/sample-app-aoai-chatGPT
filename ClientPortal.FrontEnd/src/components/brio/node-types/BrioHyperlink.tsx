import { Flex, FlexCol, Icon, IconExternalLink, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { BrioNode } from '../../../types'
import { decodeBase64 } from '../../../utils/base64'
import { BrioInputLabel } from '../input/BrioInputLabel'

export const BrioHyperlink: FC<BrioNode> = ({ id, text, helpText, value }) => (
  <FlexCol gap={4}>
    <BrioInputLabel helpText={helpText} text={text} />
    <a href={decodeBase64(id)} target="_blank" rel="noreferrer">
      <Flex alignItems="center" gap={4}>
        <Text>{value}</Text>
        <Icon icon={IconExternalLink} color="text-positive" size={20} />
      </Flex>
    </a>
  </FlexCol>
)
