import { Text } from '@carnegie/duplo'
import { FC } from 'react'

type Props = {
  currentPage: number
  totalPages: number
}

export const BrioPagination: FC<Props> = ({ currentPage, totalPages }) => (
  <Text>
    {currentPage} / {totalPages}
  </Text>
)
