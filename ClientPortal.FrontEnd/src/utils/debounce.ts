type Callback = (...args: any[]) => any

export const debounce = (callback: Callback, timeout = 250) => {
  let timer: NodeJS.Timeout

  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => callback(...args), timeout)
  }
}
