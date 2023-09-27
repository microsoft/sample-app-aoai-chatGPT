import { TFunction } from 'i18next'
import { BrioNavigation, CountriesResponse, PersonResponse, QuestionnairePage } from '../../types'
import { getPage1 } from './subnodes/page-1'
import { getPage2 } from './subnodes/page-2'

type Options = {
  t: TFunction<'questionnaires'>
  countries: CountriesResponse
  person: PersonResponse
}

const navigation: BrioNavigation = {
  currentPage: 0,
  next: { enabled: false, text: 'ignored' },
  previous: { enabled: false, text: 'ignored' },
  totalPages: 0,
}

export const generateBaseInfoPages = ({ t, countries, person }: Options): QuestionnairePage[] => [
  {
    navigation,
    rootNode: { subNodes: getPage1({ t, person }) },
  },
  {
    navigation,
    rootNode: { subNodes: getPage2({ t, countries, person }) },
  },
  {
    navigation,
    rootNode: { subNodes: [] },
  },
]
