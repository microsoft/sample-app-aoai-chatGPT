import { useCallback } from 'react'
import { useApplicationInsightsContext } from '../context/providers/application-insights-context-provider'
import { AuditCategory, AuditOperation } from '../types/bff/auditevent'
import { useBff } from './api/use-bff'

export const useAudit = () => {
  const bff = useBff()
  const { trackException } = useApplicationInsightsContext()

  const auditEvent = useCallback(
    (category: AuditCategory, operation: AuditOperation, value?: string | number) =>
      bff.post('audit', { category, operation, value: value?.toString() }).catch(trackException),
    [bff, trackException],
  )

  return { auditEvent }
}
