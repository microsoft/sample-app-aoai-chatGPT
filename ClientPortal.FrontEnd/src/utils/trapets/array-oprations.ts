export const arrayWithValuesOrEmpty = (defaultValue: any): any => {
  return Array.isArray(defaultValue) && defaultValue.length ? defaultValue : []
}

export const arrayOrEmpty = (defaultValue: any): any => {
  return Array.isArray(defaultValue) ? defaultValue : []
}
