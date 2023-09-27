import { CSSGrid, GridBox, useResponsiveProps } from '@carnegie/duplo'
import { ParentFC } from '../../types'

export const CenteredGrid: ParentFC = ({ children }) => {
  const rp = useResponsiveProps()

  return (
    <CSSGrid cols={12} pt={32} pb={64}>
      <GridBox colStart={rp([2, 4, 5])} colSpan={rp([10, 6, 4])} width="full">
        {children}
      </GridBox>
    </CSSGrid>
  )
}
