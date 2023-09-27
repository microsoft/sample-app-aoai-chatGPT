import { FC } from 'react'
import { BRIO_DROP_DOWN_AUTOCOMPLETE } from '../../../constants'
import { BrioInputWithOptions } from '../../../types'
import { BrioAutocomplete } from './BrioAutocomplete'
import { BrioSelect } from './BrioSelect'

export const BrioDropDownList: FC<BrioInputWithOptions> = props =>
  (props.options || []).length >= BRIO_DROP_DOWN_AUTOCOMPLETE ? (
    <BrioAutocomplete {...props} />
  ) : (
    <BrioSelect {...props} />
  )
