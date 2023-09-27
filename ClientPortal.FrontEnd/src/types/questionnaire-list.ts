import { QuestionnaireItemOrigin, QuestionnaireStatus } from '../enums'

export type QuestionnaireItem = {
  id: number
  name: string
  origin: QuestionnaireItemOrigin
  reference: string | null
  status: QuestionnaireStatus
  sortOrder: number
}
