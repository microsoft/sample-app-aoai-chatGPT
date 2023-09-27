import { BrioNavigation } from '../../types'

export const generateBaseInfoNavigation = (page: number): BrioNavigation => {
  switch (page) {
    case 1:
      return {
        currentPage: page,
        next: { enabled: true, text: '#DefaultNextPage#' },
        previous: { enabled: false, text: '#DefaultPreviousPage#' },
        totalPages: 2,
      }

    case 2:
      return {
        currentPage: page,
        next: { enabled: true, text: '#Approve#' },
        previous: { enabled: true, text: '#DefaultPreviousPage#' },
        totalPages: 2,
      }

    case 3:
      return {
        currentPage: page,
        next: { enabled: false, text: '#DefaultNextPage#' },
        previous: { enabled: false, text: '#DefaultPreviousPage#' },
        totalPages: 2,
      }

    default:
      throw new Error('Invalid page')
  }
}
