import { safelyParse } from '../utils/safely-parse'

export const IS_DEBUG = safelyParse(window?.ENV?.DEBUG) || false
