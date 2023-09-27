import { FormProvider, useForm } from 'react-hook-form'
import { ParentFC } from '../../../types'

type Props = {
  debug?: boolean
}

export const BrioFormContextProvider: ParentFC<Props> = ({ children, debug = false }) => {
  const methods = useForm({ mode: 'all', shouldUnregister: true })
  const fieldValues = methods.watch()

  if (debug) {
    if (fieldValues && Object.keys(fieldValues).length) {
      console.debug('[BrioFormContextProvider] fieldValues', fieldValues)
    }

    if (methods.formState.errors && Object.keys(methods.formState.errors).length) {
      console.debug('[BrioFormContextProvider] errors', methods.formState.errors)
    }
  }

  return <FormProvider {...methods}>{children}</FormProvider>
}
