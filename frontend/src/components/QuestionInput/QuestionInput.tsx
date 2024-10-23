import { useContext, useState, useRef } from 'react'
import { FontIcon, Stack, TextField } from '@fluentui/react'
import { SendRegular } from '@fluentui/react-icons'

import Send from '../../assets/Send.svg'

import styles from './QuestionInput.module.css'
import { ChatMessage } from '../../api'
import { AppStateContext } from '../../state/AppProvider'
import { resizeImage } from '../../utils/resizeImage'

interface Props {
  onSend: (question: ChatMessage['content'], id?: string) => void
  onInputChange: (lines: number) => void;
  disabled: boolean
  placeholder?: string
  clearOnSend?: boolean
  conversationId?: string
}

export const QuestionInput = ({ onSend, onInputChange, disabled, placeholder, clearOnSend, conversationId }: Props) => {
  const [question, setQuestion] = useState<string>('')
  const questionRef = useRef<string>("");
  const linesRef = useRef<number>(1); //immediate number of lines in textbox are saved in this
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const appStateContext = useContext(AppStateContext)
  const OYD_ENABLED = appStateContext?.state.frontendSettings?.oyd_enabled || false;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      await convertToBase64(file);
    }
  };

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

    const questionTest: ChatMessage["content"] = base64Image ? [{ type: "text", text: question }, { type: "image_url", image_url: { url: base64Image } }] : question.toString();

    if (conversationId && questionTest !== undefined) {
      onSend(questionTest, conversationId)
      setBase64Image(null)
    } else {
      onSend(questionTest)
      setBase64Image(null)
    }

    if (clearOnSend) {
      linesRef.current = 1;
      setQuestion('')
    }
  }

  const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !(ev.nativeEvent?.isComposing === true)) {
      ev.preventDefault()
      sendQuestion()
    }
  }

 //number of lines in textbox are calculated using this function
 const updateNumberOfLines = (text: string) => {
  const textField = document.createElement("div");
  textField.style.position = "absolute";
  textField.style.visibility = "hidden";
  textField.style.whiteSpace = "pre-wrap";
  textField.style.fontSize = "14px";
  textField.style.lineHeight = "20px";
  textField.style.width = "800px";
  document.body.appendChild(textField);
  textField.textContent = questionRef.current;
  const computedStyle = window.getComputedStyle(textField);
  const height = parseFloat(computedStyle.height);
  const lineHeight = parseFloat(computedStyle.lineHeight);
  const numberOfLines = Math.ceil(height / lineHeight);
  linesRef.current = numberOfLines + 2; //adding two extra lines so that content is not hidden in textfield
  onInputChange(linesRef.current);
  if (textField.parentNode) {
    textField.parentNode.removeChild(textField);
  }
};

const onQuestionChange = (
  _ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  newValue?: string
) => {
  questionRef.current = newValue || "";
  setQuestion(newValue || "");
  updateNumberOfLines(questionRef.current);
};

  const sendQuestionDisabled = disabled || !question.trim()

  return (
    <Stack horizontal className={styles.questionInputContainer} style={{height: Math.min(200, linesRef.current * 20)<120?'120px': `${Math.min(200, linesRef.current * 20)+12}px`}}>
      <TextField
        className={styles.questionInputTextArea}
        placeholder={placeholder}
        multiline
        resizable={false}
        borderless
        value={question}
        onChange={onQuestionChange}
        onKeyDown={onEnterPress}
        autoAdjustHeight={false}
        style={{
          width: "auto",
          fontSize: "14px",
          lineHeight: "20px",
          height: `${Math.min(200, linesRef.current * 20)}px`,
          overflowY: linesRef.current * 20 < 200 ? "hidden" : "auto",
        }}
      />
      {!OYD_ENABLED && (
        <div className={styles.fileInputContainer}>
          <input
            type="file"
            id="fileInput"
            onChange={(event) => handleImageUpload(event)}
            accept="image/*"
            className={styles.fileInput}
          />
          <label htmlFor="fileInput" className={styles.fileLabel} aria-label='Upload Image'>
            <FontIcon
              className={styles.fileIcon}
              iconName={'PhotoCollection'}
              aria-label='Upload Image'
            />
          </label>
        </div>)}
      {base64Image && <img className={styles.uploadedImage} src={base64Image} alt="Uploaded Preview" />}
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
