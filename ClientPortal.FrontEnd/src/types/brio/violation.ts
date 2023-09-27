export type BrioRuleViolation = {
  fieldId: string
  fieldText: string
  message: string
  questionId: string
}

export type RuleViolations = { ruleViolations: BrioRuleViolation[] }
