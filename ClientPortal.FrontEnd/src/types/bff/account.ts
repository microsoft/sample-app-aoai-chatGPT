export type InitiateAccount = {
  url: string
}

export type InitiateAccountResponse = {
  item?: InitiateAccount
  error?: string
}

export enum CreateAccountStateEnum {
  Initiated = 'Initiated',
  AgreementSigned = 'AgreementSigned',
  ClientCreated = 'ClientCreated',
  AccountCreated = 'AccountCreated',
  Completed = 'Completed',
  Failed = 'Failed',
}

export type AccountState = {
  accountType?: string
  loginUrl?: string
  serviceOfferingId: number
  state: CreateAccountStateEnum
}

export type AccountStateResponse = {
  item?: AccountState
  error?: string
}
