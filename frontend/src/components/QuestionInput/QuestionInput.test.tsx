import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ACCEPTED_FILE_TYPES } from '../../custom/fileUploadUtils'
import { QuestionInput } from './QuestionInput'

import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

async function uploadFile(file: File) {
  const fileInput = screen.getByLabelText('Upload file')

  await fireEvent.change(fileInput, { target: { files: [file] } })
}

function inputChatMessage(message?: string) {
  const textInputField = screen.getByLabelText('Type a question')

  fireEvent.change(textInputField, {
    target: { value: message ?? 'This is my message' }
  })
}

function submitChatMessage() {
  const submitButton = screen.getByLabelText('Ask question button')

  fireEvent.click(submitButton)
}

const createMockFile = (extension: string, fileType: string, fileSizeInMb?: number): File => {
  const blob = new Blob(['hello'], { type: fileType })
  const file = new File([blob], `default.${extension}`, { type: fileType })
  if (fileSizeInMb) {
    Object.defineProperty(file, 'size', { value: 1024 * 1024 * fileSizeInMb })
  }

  return file
}

describe('Test uploading files', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['jpg', ACCEPTED_FILE_TYPES.JPEG],
    ['png', ACCEPTED_FILE_TYPES.PNG],
    ['gif', ACCEPTED_FILE_TYPES.GIF],
    ['bmp', ACCEPTED_FILE_TYPES.BMP],
    ['tiff', ACCEPTED_FILE_TYPES.TIFF],
    ['docx', ACCEPTED_FILE_TYPES.DOCX],
    ['csv', ACCEPTED_FILE_TYPES.CSV],
    ['pdf', ACCEPTED_FILE_TYPES.PDF]
  ])('uploads files with extension .%s without errors', async (extension: string, fileType: ACCEPTED_FILE_TYPES) => {
    const uploadedFile = createMockFile(extension, fileType)

    const { container } = render(
      <QuestionInput
        onSend={() => {}}
        disabled={false}
        placeholder={'placeholder'}
        conversationId={undefined}
        clearOnSend={false}
      />
    )

    await act(async () => {
      uploadFile(uploadedFile)
      inputChatMessage()
      submitChatMessage()
    })

    expect(await axe(container)).toHaveNoViolations()
  })

  it('displays an error if the uploaded file is not of a valid filetype', async () => {
    const uploadedFile = createMockFile('fakeExtension', 'invalid/filetype')

    const { container } = render(
      <QuestionInput
        onSend={() => {}}
        disabled={false}
        placeholder={'placeholder'}
        conversationId={undefined}
        clearOnSend={false}
      />
    )

    await act(async () => {
      uploadFile(uploadedFile)
      inputChatMessage()
      submitChatMessage()
    })

    const inputError = screen.queryByText(/Only the following file types are supported/i)

    expect(inputError).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it.each([
    ['jpg', ACCEPTED_FILE_TYPES.JPEG],
    ['png', ACCEPTED_FILE_TYPES.PNG],
    ['gif', ACCEPTED_FILE_TYPES.GIF],
    ['bmp', ACCEPTED_FILE_TYPES.BMP],
    ['tiff', ACCEPTED_FILE_TYPES.TIFF]
  ])(
    'displays an error if an image file with extension .%s that exceeds the maximum upload size is added',
    async (extension: string, fileType: ACCEPTED_FILE_TYPES) => {
      const uploadedFile = createMockFile(extension, fileType, 11)

      const { container } = render(
        <QuestionInput
          onSend={() => {}}
          disabled={false}
          placeholder={'placeholder'}
          conversationId={undefined}
          clearOnSend={false}
        />
      )

      await act(async () => {
        uploadFile(uploadedFile)
      })

      const inputError = screen.queryByText(/File size of image attachments cannot exceed 10 MB/i)

      expect(inputError).toBeInTheDocument()

      expect(await axe(container)).toHaveNoViolations()
    }
  )

  it.each([
    ['docx', ACCEPTED_FILE_TYPES.DOCX],
    ['csv', ACCEPTED_FILE_TYPES.CSV],
    ['pdf', ACCEPTED_FILE_TYPES.PDF]
  ])(
    'displays an error if a non-image file with extension .%s that exceeds the maximum upload size is added',
      async (extension: string, fileType: ACCEPTED_FILE_TYPES) => {
        const uploadedFile = createMockFile(extension, fileType, 51)

        const { container } = render(
          <QuestionInput
            onSend={() => {}}
            disabled={false}
            placeholder={'placeholder'}
            conversationId={undefined}
            clearOnSend={false}
          />
        )

        await act(async () => {
          uploadFile(uploadedFile)
        })

        const inputError = screen.queryByText(/File size of non-image attachments cannot exceed 50 MB/i)

        expect(inputError).toBeInTheDocument()

        expect(await axe(container)).toHaveNoViolations()
      }
    
  )
})
