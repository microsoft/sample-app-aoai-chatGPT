export const resizeImage = (file: Blob, maxWidth: number, maxHeight: number) => {
  const img = new Image()
  const reader = new FileReader()

  reader.readAsDataURL(file)
  reader.onloadend = () => {
    img.src = reader.result as string
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height *= maxWidth / width
          width = maxWidth
        } else {
          width *= maxHeight / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
      }

      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8)
      return resizedBase64
    }
  }
  reader.onerror = error => {
    console.error('Error: ', error)
  }
}
