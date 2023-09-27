import { CreateAccountStateEnum } from '../../types/bff/account'

const AgreementSignedStates = [
  CreateAccountStateEnum.ClientCreated,
  CreateAccountStateEnum.AccountCreated,
  CreateAccountStateEnum.Completed,
]

export const isAgreementSigned = (accountStateItemState?: CreateAccountStateEnum) => {
  return accountStateItemState && AgreementSignedStates.includes(accountStateItemState)
}
