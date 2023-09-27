import { FieldValues, SubmitHandler, useFormContext } from 'react-hook-form'
import { ParentFC } from '../../../types'
import { noop } from '../../../utils/noop'

type Props = {
  onSubmit?: SubmitHandler<FieldValues>
}

export const BrioForm: ParentFC<Props> = ({ children, onSubmit = noop }) => {
  const { handleSubmit } = useFormContext()
  return <form onSubmit={handleSubmit(onSubmit)}>{children}</form>
}
