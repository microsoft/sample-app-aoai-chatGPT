import { Axios } from 'axios'

const APPLICATION_JSON = 'application/json'

type Options = {
  csrfToken?: string | null
  withCredentials?: boolean
}

export const useAxios = (baseURL: string, { csrfToken, withCredentials }: Options = {}): Axios => {
  const axios = new Axios({
    baseURL,
    headers: {
      Accept: '*',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': APPLICATION_JSON,
      ...(csrfToken ? { 'x-curity-csrf': csrfToken } : {}),
    },
    validateStatus: status => status < 400,
    withCredentials,
  })

  axios.interceptors.request.use(request => {
    if (typeof request.data !== 'object') return request

    request.data = JSON.stringify(request.data)
    request.headers['Content-Type'] = APPLICATION_JSON

    return request
  })

  axios.interceptors.response.use(response => {
    const contentType = response.headers['content-type']

    if (contentType?.includes(APPLICATION_JSON)) {
      response.data = JSON.parse(response.data)
    }

    return response
  })

  return axios
}
