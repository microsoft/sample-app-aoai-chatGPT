import { TFunction } from 'i18next'
import { CountriesResponse, PersonResponse, QuestionnaireStartResponse } from '../../types'
import { generateBaseInfoNavigation } from './generate-base-info-navigation'
import { generateBaseInfoSubNodes } from './generate-base-info-subnodes'

type Options = {
  t: TFunction<'questionnaires'>
  countries: CountriesResponse
  page: number
  person: PersonResponse
}

export const generateBaseInfoQuestionnaire = ({
  t,
  countries,
  page,
  person,
}: Options): QuestionnaireStartResponse => ({
  status: 'ignored',
  pageDefinition: {
    rootNode: {
      subNodes: generateBaseInfoSubNodes({ t, person, countries, page }),
    },
    navigation: generateBaseInfoNavigation(page),
    isPreview: false,
  },
  ruleViolations: [],
})
