import { QuestionnaireStatus } from '../../enums'
import { BrioNavigation, BrioRootNode } from '../brio'

export type QuestionnairePage = {
  navigation: BrioNavigation
  rootNode: BrioRootNode
}

export type QuestionnaireResponse = {
  cddId: number
  pages: QuestionnairePage[]
  personId: number
  questionnaireName: string
  status: QuestionnaireStatus | string
  updated: string
}
