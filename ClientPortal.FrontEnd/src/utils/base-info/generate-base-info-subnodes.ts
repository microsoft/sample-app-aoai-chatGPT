import { TFunction } from 'i18next'
import { BrioNode, CountriesResponse, PersonResponse } from '../../types'
import { getPage1 } from './subnodes/page-1'
import { getPage2 } from './subnodes/page-2'

type Options = {
  t: TFunction<'questionnaires'>
  countries: CountriesResponse
  page: number
  person: PersonResponse
}

export const generateBaseInfoSubNodes = ({ t, countries, page, person }: Options): BrioNode[] => {
  if (!person || !countries?.items?.length) return []

  switch (page) {
    case 1:
      return getPage1({ t, person })

    case 2:
      return getPage2({ t, countries, person })

    case 3:
      return []

    default:
      throw new Error('Invalid page')
  }
}
