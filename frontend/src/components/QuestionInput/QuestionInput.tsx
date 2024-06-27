import { useRef, useState } from 'react'
import { Stack, TextField } from '@fluentui/react'
import { SendRegular } from '@fluentui/react-icons'
import pdfToText from 'react-pdftotext'

import Send from '../../assets/Send.svg'

import styles from './QuestionInput.module.css'
import { ACCEPTED_FILE_TYPES, FileType, UploadedFile } from '../../custom/fileUploadUtils'
import { logEvent } from '../../custom/logEvent'
import InfoIcon from '../../assets/info.svg'

interface Props {
  onSend: (question: string, id?: string, uploadedFile?: UploadedFile) => void
  disabled: boolean
  placeholder?: string
  clearOnSend?: boolean
  conversationId?: string
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, conversationId }: Props) => {
  const [question, setQuestion] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [fileError, setFileError] = useState<string>('')

  const sendQuestion = () => {
    if (disabled || !question.trim()) {
      return
    }

    const send = (uploadedFile?: UploadedFile) => {
      if (conversationId) {
        onSend(question, conversationId, uploadedFile)
      } else {
        onSend(question, undefined, uploadedFile)
      }

      if (clearOnSend) {
        setQuestion('')
        setSelectedFile(null)
        setFileError('')
        if (fileInputRef?.current?.value) {
          fileInputRef.current.value = ''
        }
      }
    }

    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        pdfToText(selectedFile)
          .then(extractedText => {
            if (extractedText.length === 0) {
              setFileError('Could not read text from PDF. Please try uploading a different file.')
            } else {
              send({
                name: selectedFile.name,
                type: FileType.Pdf,
                contents: extractedText
              })
            }
          })
          .catch(_error => {
            setFileError('Failed to upload PDF. Please try uploading a different file.')
          })
      } else {
        const reader = new FileReader()
        reader.onloadend = () => {
          send({
            name: selectedFile.name,
            type: FileType.Image,
            contents: reader.result as string
          })
        }
        reader.readAsDataURL(selectedFile)
      }
    } else {
      send()
    }
  }

  const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !(ev.nativeEvent?.isComposing === true)) {
      ev.preventDefault()
      sendQuestion()
    }
  }

  const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setQuestion(newValue || '')
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setFileError(`File size of attachments cannot exceed 5 MB. Please try a smaller file.`)
        setSelectedFile(null)
        if (fileInputRef?.current?.value) {
          fileInputRef.current.value = ''
        }
        logEvent('[Error] File exceeded limit', { object_size: file.size, object_type: file.type })
      } else {
        setFileError('')
        setSelectedFile(file)
      }
    }
  }

  const sendQuestionDisabled = disabled || !question.trim()

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      {fileError && (
        <div className={styles.errorText}>
          <img src={InfoIcon} alt="" />
          {fileError}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(',')}
        onChange={onFileChange}
        disabled={disabled}
        className={styles.fileInput}
        aria-label="Upload file"
      />
      <TextField
        className={styles.questionInputTextArea}
        placeholder={placeholder}
        multiline
        resizable={false}
        borderless
        value={question}
        onChange={onQuestionChange}
        onKeyDown={onEnterPress}
        ariaLabel="Type a question"
        inputClassName={styles.textAreaOverrides}
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
          <img src={Send} className={styles.questionInputSendButton} alt="Send Button" />
        )}
      </div>
      <div className={styles.questionInputBottomBorder} />
    </Stack>
  )
}
