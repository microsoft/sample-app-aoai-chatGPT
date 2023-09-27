import { FC } from 'react'
import { FieldValues } from 'react-hook-form'
import { AccountInfo } from '../components/account/AccountInfo'
import { AccountPolicy } from '../components/account/AccountPolicy'
import { BrioForm } from '../components/brio/form/BrioForm'
import { BrioFormContextProvider } from '../components/brio/form/BrioFormContextProvider'
import { AccountState } from '../types/bff/account'

interface AccountQuestionnaireContainerProps {
  page: number
  onNext(fieldValues: FieldValues): void
  isLoading: boolean
  accountStateItem: AccountState
}

export const AccountQuestionnaireContainer: FC<AccountQuestionnaireContainerProps> = ({
  page,
  onNext,
  isLoading,
  accountStateItem,
}) => {
  return (
    <BrioFormContextProvider>
      <BrioForm onSubmit={onNext}>
        {page == 1 ? (
          <AccountInfo />
        ) : (
          <AccountPolicy isLoading={isLoading} accountStateItem={accountStateItem} />
        )}
      </BrioForm>
    </BrioFormContextProvider>
  )
}
