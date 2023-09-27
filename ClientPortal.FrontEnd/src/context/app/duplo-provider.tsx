import type { DuploComponentSettings } from '@carnegie/duplo'
import { DuploProvider as _DuploProvider } from '@carnegie/duplo'
import type { ContextProvider } from '../../types'

const defaultComponentSettings: DuploComponentSettings = {
  menu: {
    size: 'medium',
  },
  segment: {
    headingVariant: 'h6',
  },
}

export const DuploProvider: ContextProvider = ({ children }) => (
  <_DuploProvider componentSettings={defaultComponentSettings}>{children}</_DuploProvider>
)
