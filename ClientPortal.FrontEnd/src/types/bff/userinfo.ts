export type UserinfoResponse = {
  id: number
  firstName: string
  officialFirstName: string | null
  surName: string
  name: string
  isEmployee: boolean
  isCustomer: boolean
  isProspect: boolean
  canSelfInitiate: boolean
  hasDashboardAccess: boolean
}
