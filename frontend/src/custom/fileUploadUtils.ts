export const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'application/pdf'
]

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
