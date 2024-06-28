import pdfToText from 'react-pdftotext'

export const ACCEPTED_FILE_TYPES = ['.jpg', '.png', '.gif', '.bmp', '.tiff', '.pdf']

export interface UploadedFile {
  name: string
  type: FileType
  contents: string
  size: number
  extension: string
}

export enum FileType {
  Image,
  Pdf
}
