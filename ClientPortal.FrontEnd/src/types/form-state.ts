export type FormState = Record<string, FormValue>

export type FormValue = string | number | boolean | null | string[]

export type FormOption = {
  id: string
  text: string
}
