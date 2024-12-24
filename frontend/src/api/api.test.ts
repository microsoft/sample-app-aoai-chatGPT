import { UploadedFile, ACCEPTED_FILE_TYPES } from '../custom/fileUploadUtils'
import { ChatMessage, ConversationRequest } from '../api/models'
import { conversationApi } from './api'

describe('Test the conversationApi function', () => {
  const defaultUploadedFile: UploadedFile = {
    name: 'default name',
    contents: 'default contents',
    size: 100,
    extension: 'default extension'
  }

  const defaultAbortSignal: AbortSignal = new AbortController().signal

  const defaultFetchRequest = {
    body: '',
    headers: { 'Content-Type': 'application/json', 'conversation-id': '' },
    method: 'POST',
    signal: defaultAbortSignal
  }

  const createConversationRequestWithUploadedFile = (file?: UploadedFile): ConversationRequest => {
    return {
      messages: [
        {
          id: 'default id',
          role: 'default role',
          content: 'default content',
          date: 'default date',
          uploaded_file: file ?? undefined
        }
      ]
    }
  }

  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('formats content correctly when there is no uploaded file', async () => {
    const conversationRequest = createConversationRequestWithUploadedFile()

    await conversationApi(conversationRequest, defaultAbortSignal, null)

    expect(fetch).toHaveBeenCalledWith('/conversation', {
      ...defaultFetchRequest,
      body: expect.stringContaining('"content":"default content"')
    })
  })

  it('formats content correctly when an image file is uploaded', async () => {
    const imageFile: UploadedFile = { ...defaultUploadedFile, extension: ACCEPTED_FILE_TYPES.JPEG }
    const conversationRequest = createConversationRequestWithUploadedFile(imageFile)

    await conversationApi(conversationRequest, defaultAbortSignal, null)

    expect(fetch).toHaveBeenCalledWith('/conversation', {
      ...defaultFetchRequest,
      body: expect.stringContaining('image_url')
    })
  })

  it('formats content correctly when a .pdf is uploaded', async () => {
    const pdfFile: UploadedFile = { ...defaultUploadedFile, extension: ACCEPTED_FILE_TYPES.PDF }
    const conversationRequest = createConversationRequestWithUploadedFile(pdfFile)

    await conversationApi(conversationRequest, defaultAbortSignal, null)

    expect(fetch).toHaveBeenCalledWith('/conversation', {
      ...defaultFetchRequest,
      body: expect.stringContaining('Use the following document in your responses')
    })
  })

  it('formats content correctly when a .docx file is uploaded', async () => {
    const docxFile: UploadedFile = { ...defaultUploadedFile, extension: ACCEPTED_FILE_TYPES.DOCX }
    const conversationRequest = createConversationRequestWithUploadedFile(docxFile)

    await conversationApi(conversationRequest, defaultAbortSignal, null)

    expect(fetch).toHaveBeenCalledWith('/conversation', {
      ...defaultFetchRequest,
      body: expect.stringContaining('Use the following document in your responses')
    })
  })

  it('formats content correctly when a .csv file is uploaded', async () => {
    const csvFile: UploadedFile = { ...defaultUploadedFile, extension: ACCEPTED_FILE_TYPES.CSV }
    const conversationRequest = createConversationRequestWithUploadedFile(csvFile)

    await conversationApi(conversationRequest, defaultAbortSignal, null)

    expect(fetch).toHaveBeenCalledWith('/conversation', {
      ...defaultFetchRequest,
      body: expect.stringContaining('CSV format')
    })
  })
})
