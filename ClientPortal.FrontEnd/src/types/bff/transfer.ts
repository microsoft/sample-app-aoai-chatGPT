export interface BankModel {
  bankId: number
  name: string
  clearingNumberRanges: ClearingNumberRangeModel[]
}

interface ClearingNumberRangeModel {
  minRange: number
  maxRange: number
}

export interface DefaultBankAccount {
  bankId?: number
  accountNo: string
}
