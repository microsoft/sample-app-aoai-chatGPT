export type BrioNavigation = {
  currentPage: number
  next: BrioNavigationItem
  previous: BrioNavigationItem
  totalPages: number
}

export type BrioNavigationText = '#DefaultNextPage#' | '#DefaultPreviousPage#' | string

export type BrioNavigationItem = {
  enabled: boolean
  text: BrioNavigationText
}
