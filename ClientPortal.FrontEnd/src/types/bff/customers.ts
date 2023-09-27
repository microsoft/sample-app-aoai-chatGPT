export type CalculatedRisk = {
  calculatedRisk: number
}

export type PEPStatus = {
  pepStatus: number
  updatedBy: string
}

export type TrapetsCustomerResponse = {
  address1: string
  address2: string
  address3: string
  addressCountryCode: string
  attention: string
  business: string
  calculatedRisk: CalculatedRisk[]
  citizenCountryCode: string
  city: string
  customerTypeId: string
  dateOfBirth: string // Date
  deleteTime: string // Date
  deregistrationDate: string // Date
  email: string
  entityType: string
  externalKyc: boolean
  externalPep: number
  externalRisk: number
  extraName: string
  firstName: string
  identificationIssuerCountry: string
  identificationNumber: string
  identificationType: string
  insertTime: string // Date
  isDeleted: boolean
  lastName: string
  mifidCategory: string
  mobilephone: string
  officeId: string
  pepStatus: PEPStatus[]
  personId: number
  phone: string
  registrationDate: string // Date
  registrationId: string
  registrationIdCountryCode: string
  taxCountryCode: string
  workPhone: string
  xmlData: string
  zip: string
}
