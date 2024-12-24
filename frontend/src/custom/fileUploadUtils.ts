export enum ACCEPTED_FILE_TYPES {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  BMP = 'image/bmp',
  TIFF = 'image/tiff',
  PDF = 'application/pdf',
  CSV = 'text/csv',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

export interface UploadedFile {
  name: string
  contents: string
  size: number
  extension: string
}

export const isImageFile = (file: UploadedFile): boolean => {
  return file.extension.includes('image')
}
