export const resizeImage = (file: Blob, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.readAsDataURL(file)
    reader.onloadend = () => {
      img.src = reader.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        let { width, height } = img

        // Calculate the new dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (maxWidth / width) * height
            width = maxWidth
          } else {
            width = (maxHeight / height) * width
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
        }

        // Convert the canvas to a base64 string
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8)
        resolve(resizedBase64)
      }

      img.onerror = error => {
        reject('Error loading image: ' + error)
      }
    }

    reader.onerror = error => {
      reject('Error reading file: ' + error)
    }
  })
}
