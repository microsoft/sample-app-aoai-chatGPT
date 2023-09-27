import { PersonIdentificationType } from '../party'

export type BffBaseInfoCitizenship = {
  countryCode: string
  identifier: string | null
  identifierType: PersonIdentificationType
}

export type BffBaseInfoTaxCountry = {
  countryCode: string
  tin: string | null
  primary: boolean
}

export type BffBaseInfoRequestBody = {
  citizenships: BffBaseInfoCitizenship[]
  taxCountries: BffBaseInfoTaxCountry[]
  confirmation: boolean
}
