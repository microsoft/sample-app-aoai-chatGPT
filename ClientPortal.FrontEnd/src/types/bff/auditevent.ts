export type AuditEvent = {
  category: AuditCategory
  operation: AuditOperation
  value: string | number
}

export type AuditCategory = 'Person'
export type AuditOperation = 'Read' | 'Modify' | 'Insert' | 'Delete'
