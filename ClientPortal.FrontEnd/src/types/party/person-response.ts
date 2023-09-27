export type PersonResponse = {
  id: number
  firstName: string
  officialFirstName: string | null
  surName: string
  birthDate: string
  citizenships: PersonCountry[]
  type: 'Physical' | string
  primaryTaxCountry: PersonCountry | undefined
  identifications: PersonIdentification[]
  hasAutomaticUpdate: boolean
  name: string
  addresses: PersonAddress[]
  emails: PersonEmail[]
  phoneNumbers: PersonPhone[]
  secondaryIdentifications: PersonIdentification[]
}

export type PersonAddress = {
  id: number
  attentionName: string | null
  address1: string | null
  address2: string | null
  address3: string | null
  addressNumber: number
  postalCode: string
  city: string
  country: PersonCountry
  isDomicile: boolean
  isPreferred: boolean
  hasAutomaticUpdate: boolean
}

export type PersonCountry = {
  countryCode: 'SE' | string
  name: 'Sverige' | string
}

export type PersonEmail = {
  id: number
  email: string
  isPreferred: boolean
}

export type PersonIdentificationType =
  | 'DepartmentId'
  | 'EstateRegistrationNumber'
  | 'GIIN'
  | 'LEI'
  | 'NationalIdConcat'
  | 'NationalIdPassport'
  | 'NationalIdRegNo'
  | 'NationalRegNo'
  | 'OrganizationShortName'
  | 'PeopleId'
  | 'TaxIdNumber'
  | 'UniqueLEI'
  | 'UniqueTaxIdNumber'
  | 'VATNumber'

export type PersonIdentification = {
  type: PersonIdentificationType
  identifier: string
  country: PersonCountry
  hasAutomaticUpdate: boolean
  deleted: boolean
}

export type PersonPhone = {
  id: number
  number: string
  isPreferred: boolean
  type: 'Mobile' | string
}

export type PersonLanguage = {
  languageCode: 'sv' | string
  name: 'Svenska' | string
}
