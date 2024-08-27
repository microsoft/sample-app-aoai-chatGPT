import { useEffect, useRef, useState } from 'react'
import { Stack, TextField } from '@fluentui/react'
import { AddSquareRegular, SendRegular, DismissCircleFilled, AddSquareFilled } from '@fluentui/react-icons'

import Send from '../../assets/Send.svg'

import styles from './QuestionInput.module.css'

interface Props {
  onSend: (question: string, id?: string, filebase64?: string) => void
  disabled: boolean
  placeholder?: string
  clearOnSend?: boolean
  conversationId?: string
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, conversationId }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState<string>(' ')
  const [file, setFile] = useState<File | undefined>(undefined)
  const [fileName, setFileName] = useState<string>('')
  const [filebase64, setFileBase64] = useState<string>('')
  const [isHovered, setIsHovered] = useState(false);

  const sendQuestion = () => {
    if (disabled || (!question.trim() && !filebase64)) {
      return
    }

    if (conversationId) {
      if (filebase64) {
        onSend(question, conversationId, filebase64)
      }
      else {
        onSend(question, conversationId, undefined)

      }
    }
    else {
      if (filebase64) {
        onSend(question, undefined, filebase64)
      }
      else {
        onSend(question, undefined, undefined)
      }
    }

    if (clearOnSend) {
      setQuestion('')
      setFile(undefined)
      setFileName('')
      setFileBase64('')
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

  const convertToBase64 = (file: File) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result) {
          setFileBase64(reader.result.toString());
        }
      }
      reader.onerror = (error) => {
        console.error("There was an error reading the file!", error)
      }
  }

  // Function to handle paste event
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          convertToBase64(blob);
        }
        break;
      }
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFile(file)
      setFileName(file.name)
      convertToBase64(file)
      event.target.value = ''
      // sendQuestion()
    }
  }

  useEffect(()=>{
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [])

  const sendQuestionDisabled = disabled || (!question.trim() && !filebase64)
  const handleClearImage = () => {
      setFileBase64('')
  };
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
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
    {filebase64 && (
      <div className={styles.imageWrapper}>
        <img src={filebase64} className={styles.fileDisplay} alt="Uploaded File" />
        <DismissCircleFilled className={styles.clearIcon} onClick={handleClearImage} />
      </div>
    )}
    <div className={styles.buttonContainer}>
      <div
        className={styles.imageInputSendButtonContainer}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <input
          ref={fileInputRef}
          id="image-upload"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
        {isHovered ? (
          <AddSquareFilled
            className={styles.imageInputSendButton}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          />
        ) : (
          <AddSquareRegular className={styles.imageInputSendButton} />
        )}
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Send question button"
        className={styles.questionInputSendButtonContainer}
        onClick={sendQuestion}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? sendQuestion() : null)}
      >
        {sendQuestionDisabled ? (
          <SendRegular className={styles.questionInputSendButtonDisabled} />
        ) : (
          <img src={Send} className={styles.questionInputSendButton} alt="Send Button" />
        )}
      </div>
    </div>
    <div className={styles.questionInputBottomBorder} />
  </Stack>
  )
}
