import { Axios } from 'axios'
import { useCurity } from '../../context'
import { useAxios } from '../base/use-axios'

export const useBff = (withCredentials = true): Axios => {
  const { getAntiForgeryToken } = useCurity()

  return useAxios(import.meta.env.VITE_BFF_URL, {
    csrfToken: getAntiForgeryToken(),
    withCredentials,
  })
}
