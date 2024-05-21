import { forwardRef, useCallback, useState, useContext } from 'react'
import { Stack, TextField } from '@fluentui/react'
import { SendRegular, AttachRegular } from '@fluentui/react-icons'

import Send from '../../assets/Send.svg'

import styles from './QuestionInput.module.css'
import DocumentIcon from '../../assets/Document_Solutions_Duotone.svg'

import Uploady, { Destination, useItemStartListener, useItemFinishListener, useItemErrorListener } from '@rpldy/uploady'
import UploadDropZone from '@rpldy/upload-drop-zone'
import { asUploadButton } from '@rpldy/upload-button'
import Spinner from '../common/Spinner'
import { AppStateContext } from '../../state/AppProvider'
import { indexDocument, indexStatus, frontendSettings, FrontendSettings } from '../../api'
import { FormEncType } from 'react-router-dom'

interface Props {
  onSend: (question: string, id?: string) => void
  disabled: boolean
  placeholder?: string
  clearOnSend?: boolean
  conversationId?: string
  onConversationIdUpdate?: (newConversationId: string, filename: string) => void
  onDocumentIndexing?: (isIndexing: boolean) => void
  onDocumentUploading?: (isUploading: boolean) => void
}

interface UploadSpinnerProps {
  documentUploaded: boolean
  setDocumentUploaded: React.Dispatch<React.SetStateAction<boolean>>
  onUploadStatusChange: (isUploading: boolean) => void
  onUploadSuccess: (conversationId: string, indexId: string, fileName: string) => void
}

const UploadSpinner: React.FC<UploadSpinnerProps> = ({
  documentUploaded,
  setDocumentUploaded,
  onUploadStatusChange,
  onUploadSuccess
}) => {
  const [uploading, setUploading] = useState(false)
  const [isSuccessfulUpload, setIsSuccessfulUpload] = useState(false)

  useItemStartListener(item => {
    onUploadStatusChange(true)
    setUploading(true)
    setIsSuccessfulUpload(false)
    setDocumentUploaded(false)
  })

  useItemErrorListener(item => {
    setIsSuccessfulUpload(false)
    setUploading(false)
  })

  useItemFinishListener(item => {
    if (item.uploadResponse && item.uploadStatus === 200) {
      if (item.uploadResponse.data.conversation_id) {
        onUploadStatusChange(false)

        onUploadSuccess(
          item.uploadResponse.data.conversation_id,
          item.uploadResponse.data.index_id,
          item.uploadResponse.data.document_name
        ) // Invoke the callback with the conversationId
      }
    }
    if (uploading) {
      setUploading(false)
    }
    if (isSuccessfulUpload !== (item.uploadStatus === 200)) {
      setIsSuccessfulUpload(item.uploadStatus === 200)
    }
  })

  return (
    <div className={styles.questionInputDocumentButtonContainer}>
      {uploading && <Spinner isActive={uploading} />}
      {(uploading || (isSuccessfulUpload && !documentUploaded)) && (
        <img src={DocumentIcon} className={styles.documentIcon} alt="Uploaded document" />
      )}
    </div>
  )
}

export const QuestionInput = ({
  onSend,
  disabled,
  placeholder,
  clearOnSend,
  conversationId,
  onConversationIdUpdate,
  onDocumentIndexing,
  onDocumentUploading
}: Props) => {
  const [question, setQuestion] = useState<string>('')
  const [documentUploaded, setDocumentUploaded] = useState<boolean>(false)
  const [indexId, setIndexId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const appStateContext = useContext(AppStateContext)
  const ui = appStateContext?.state.frontendSettings?.ui
  const DOCUPLOAD_MAX_SIZE_MB = appStateContext?.state.frontendSettings?.upload_max_filesize

  // useItemErrorListener((item) => {
  //   if (item.uploadStatus === 413) {
  //     setError('File size is too large')
  //   }
  // });

  const sendQuestion = useCallback(async () => {
    if (disabled || !question.trim()) {
      return
    }

    let questionValue = question

    if (clearOnSend) {
      setQuestion('')
      setDocumentUploaded(true)
    }

    if (indexId && onDocumentIndexing) {
      onDocumentIndexing(true)

      const result = await indexDocument(indexId)
      const interval: number = ((await frontendSettings()) as FrontendSettings).polling_interval || 0

      for (let i = 0; i < 100; i++) {
        await new Promise(f => setTimeout(f, interval * 1000))

        const status = await indexStatus(result)

        if (status === 'success' || status === 'transientFailure') break
      }

      onDocumentIndexing(false)
      setIndexId('')
    }

    conversationId ? onSend(questionValue, conversationId) : onSend(questionValue)
    setError('')
  }, [disabled, question, clearOnSend, indexId, onDocumentIndexing, conversationId, onSend])

  const handleUploadSuccess = useCallback(
    (newConversationId: string, uniqueId: string, filename: string) => {
      if (onConversationIdUpdate && newConversationId !== null) {
        onConversationIdUpdate(newConversationId, filename)
        setIndexId(uniqueId)
      }
    },
    [onConversationIdUpdate]
  )

  const handleUploadStatusChange = useCallback(
    (isUploading: boolean) => {
      if (onDocumentUploading) {
        onDocumentUploading(isUploading)
      }
    },
    [onDocumentUploading]
  )

  const onEnterPress = useCallback(
    (ev: React.KeyboardEvent<Element>) => {
      if (ev.key === 'Enter' && !ev.shiftKey && !(ev.nativeEvent?.isComposing === true)) {
        ev.preventDefault()
        sendQuestion()
      }
    },
    [sendQuestion]
  )

  const fileSizeOk = useCallback(async (file: any) => {
    setError('')
    if (DOCUPLOAD_MAX_SIZE_MB && file.size > DOCUPLOAD_MAX_SIZE_MB * 1024 * 1024) {
      setError('File size too large. Maximum file size is ' + DOCUPLOAD_MAX_SIZE_MB + 'MB.')
      return false
    } else return true
  }, [])

  const onQuestionChange = useCallback(
    (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      setQuestion(newValue || '')
    },
    []
  )

  const sendQuestionDisabled = disabled || !question.trim()

  const uploadFileDisabled = false
  const uploadDestination: Destination = {
    url: '/document/upload'
  }

  const UploadWidget = asUploadButton(
    forwardRef<HTMLDivElement>((props, ref) => (
      <div {...props} className={styles.uploadButton}>
        <div className={styles.questionUploadButtonContainer}>
          <AttachRegular className={styles.questionUploadButton} />
        </div>
      </div>
    ))
  )

  return (
    <Uploady destination={uploadDestination} fileFilter={fileSizeOk} params={{ conversationId: conversationId }}>
      <UploadDropZone onDragOverClassName="drag-over" grouped maxGroupSize={3}>
        <Stack horizontal className={styles.questionInputContainer}>
          <TextField
            className={styles.questionInputTextArea}
            placeholder={placeholder}
            multiline
            resizable={false}
            borderless
            value={question}
            onChange={onQuestionChange}
            onKeyDown={onEnterPress}
          />

          <Stack horizontal className={styles.questionInputActionsContainer}>
            <UploadWidget />
            {error && <span className={styles.error}>{error}</span>}
            <UploadSpinner
              documentUploaded={documentUploaded}
              setDocumentUploaded={setDocumentUploaded}
              onUploadSuccess={handleUploadSuccess}
              onUploadStatusChange={handleUploadStatusChange}
            />
            <div
              className={styles.questionInputSendButtonContainer}
              role="button"
              tabIndex={0}
              aria-label="Ask question button"
              onClick={sendQuestion}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ' ? sendQuestion() : null)}>
              {sendQuestionDisabled ? (
                <SendRegular className={styles.questionInputSendButtonDisabled} />
              ) : (
                <img src={Send} className={styles.questionInputSendButton} />
              )}
            </div>
          </Stack>
        </Stack>
      </UploadDropZone>
    </Uploady>
  )
}
