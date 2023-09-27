import { BrioNavigation, BrioRootNode, BrioRuleViolation } from '../brio'

export type QuestionnaireStartResponse = {
  status: string
  pageDefinition: {
    rootNode: BrioRootNode
    navigation: BrioNavigation
    isPreview: boolean
  }
  ruleViolations: BrioRuleViolation[]
}
