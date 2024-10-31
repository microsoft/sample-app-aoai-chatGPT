import { useContext, useEffect, useState } from 'react'
import { Stack, TextField } from '@fluentui/react'
import { BsPaperclip } from 'react-icons/bs'
import { RiStopCircleLine } from 'react-icons/ri'
import { VscSend } from 'react-icons/vsc'

import styles from './QuestionInput.module.css'
import { ChatMessage } from '../../api'
import { AppStateContext } from '../../state/AppProvider'
import { resizeImage } from '../../utils/resizeImage'

interface Props {
  onSend: (question: ChatMessage['content'], id?: string) => void
  disabled: boolean
  isGenerating: boolean
  stopGenerating: () => void
  placeholder?: string
  clearOnSend?: boolean
  conversationId?: string
}

export const QuestionInput = ({
  onSend,
  disabled,
  placeholder,
  clearOnSend,
  conversationId,
  isGenerating,
  stopGenerating
}: Props) => {
  const [question, setQuestion] = useState<string>('')
  const [base64Image, setBase64Image] = useState<string | null>(null)

  const appStateContext = useContext(AppStateContext)
  const OYD_ENABLED = appStateContext?.state.frontendSettings?.oyd_enabled || false

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      await convertToBase64(file)
    }
  }

  const convertToBase64 = async (file: Blob) => {
    try {
      const resizedBase64 = await resizeImage(file, 800, 800);
      setBase64Image(resizedBase64);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendQuestion = () => {
    if (disabled || !question.trim()) {
      return
    }

    const questionTest: ChatMessage['content'] = base64Image
      ? [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: base64Image } }
        ]
      : question.toString()

    if (conversationId && questionTest !== undefined) {
      onSend(questionTest, conversationId)
      setBase64Image(null)
    } else {
      onSend(questionTest)
      setBase64Image(null)
    }

    if (clearOnSend) {
      setQuestion('')
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

  const sendQuestionDisabled = disabled || !question.trim()

  return (
    <div className={styles.bottomContainer}>
      <Stack
        className={styles.questionInputContainer}
        horizontal
        verticalAlign="center"
        styles={{ root: { width: '100%', position: 'sticky' } }}>
        <TextField
          className={styles.questionInputTextArea}
          placeholder={placeholder}
          multiline
          autoAdjustHeight={true}
          resizable={false}
          value={question}
          onChange={onQuestionChange}
          onKeyDown={onEnterPress}
          styles={{
            root: {
              width: '100%',
              borderRadius: '20px',
              backgroundColor: 'black'
            },
            fieldGroup: {
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              border: '2px solid #666666 !important',
              borderRadius: '20px',
              backgroundColor: 'black',
              overflow: 'hidden',
              minHeight: '50px',
              selectors: {
                '&:hover': {
                  border: '2px solid #666666 !important'
                },
                '&:focus': {
                  border: '2px solid #666666 !important',
                  boxShadow: 'none !important'
                },
                '&:active': {
                  border: '2px solid #666666 !important',
                  boxShadow: 'none !important'
                },
                '&::after': {
                  border: 'none !important',
                  boxShadow: 'none !important'
                },
                '&:focus::after': {
                  border: 'none !important',
                  boxShadow: 'none !important'
                }
              }
            },
            field: {
              color: 'white !important',
              backgroundColor: '#111111 !important',
              padding: '20px 40px 10px 20px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '50px',
              lineHeight: '14px',
              selectors: {
                '&:focus': {
                  outline: 'none !important',
                  borderColor: 'transparent !important'
                },
                '&:active': {
                  outline: 'none !important'
                },
                '&:hover': {
                  outline: 'none !important'
                },
                '&:focus-visible': {
                  outline: 'none !important'
                },
                '::placeholder': {
                  color: 'white !important'
                }
              }
            }
          }}
        />

        {/* {!OYD_ENABLED && (
          <div className={styles.fileInputContainer}>
            <input
              type="file"
              id="fileInput"
              onChange={(event) => handleImageUpload(event)}
              accept="image/*"
              className={styles.fileInput}
            />
            <label htmlFor="fileInput" className={styles.fileLabel} aria-label='Upload Image'>
              <BsPaperclip
                size={24}
                className={styles.fileIcon}
                aria-label='Upload Image'
              />
            </label>
          </div>)}
        {base64Image && <img className={styles.uploadedImage} src={base64Image} alt="Uploaded Preview" />} */}
        <div
          className={styles.questionInputSendButtonContainer}
          role="button"
          tabIndex={0}
          aria-label="Ask question button"
          onClick={sendQuestion}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ' ? sendQuestion() : null)}>
          {isGenerating ? (
            <RiStopCircleLine
              onClick={stopGenerating}
              className={styles.questionInputSendButton}
              aria-label="Stop Generating"
            />
          ) : sendQuestionDisabled ? (
            <VscSend className={styles.questionInputSendButtonDisabled} />
          ) : (
            <VscSend className={styles.questionInputSendButton} aria-label="Send Button" />
          )}
        </div>
        <div className={styles.questionInputBottomBorder} />
      </Stack>
      <div className={styles.disclaimer}>AI-generated content may be inaccurate</div>
    </div>
  )
}
