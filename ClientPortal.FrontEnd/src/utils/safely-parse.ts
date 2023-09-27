export const safelyParse = <T = any>(input: any): T => {
  try {
    return JSON.parse(input)
  } catch (_) {
    /* ignored */
  }
  return undefined as T
}
