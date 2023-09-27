import { Flex, LoadingIcon } from '@carnegie/duplo'
import { FC } from 'react'

export const CenteredLoading: FC = () => (
  <Flex alignItems="center" justifyContent="center">
    <LoadingIcon />
  </Flex>
)
