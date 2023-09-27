import { PersonIdentificationType } from '../party'

export type Country = {
  countryCode: string
  identificationType: PersonIdentificationType[]
  name: string
  tin: boolean
}

export type CountriesResponse = {
  items: Country[]
}
