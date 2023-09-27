import queryString from 'query-string'
import { Location } from 'react-router'

export const getRedirectUri = (location: Location): string | undefined => {
  if (!location.pathname || location.pathname === '/') return undefined

  const { assertion: _, ...rest } = queryString.parse(location.search)
  const search = Object.keys(rest).length ? queryString.stringify(rest) : undefined

  if (!search) return location.pathname

  return location.pathname + '?' + search
}
