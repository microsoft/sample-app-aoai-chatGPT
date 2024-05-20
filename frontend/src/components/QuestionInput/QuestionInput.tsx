import { useState,useRef } from 'react'
import { Stack, TextField } from '@fluentui/react'
import { SendRegular } from '@fluentui/react-icons'

import Send from '../../assets/Send.svg'

import styles from './QuestionInput.module.css'

interface Props {
  onSend: (question: string, id?: string) => void
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

  const sendQuestion = () => {
    if (disabled || !question.trim()) {
      return
    }

    if (conversationId) {
      onSend(question, conversationId)
    } else {
      onSend(question)
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
    <Stack horizontal className={styles.questionInputContainer} style={{height: Math.min(200, linesRef.current * 20)<120?'120px': `${Math.min(200, linesRef.current * 20)+12}px`	
    }}>
      <TextField
        className={styles.questionInputTextArea}
        placeholder={placeholder}
        multiline
        autoAdjustHeight={false}
        resizable={false}
        borderless
        value={question}
        onChange={onQuestionChange}
        onKeyDown={onEnterPress}
        style={{
          width: "auto",
          fontSize: "14px",
          lineHeight: "20px",
          height: `${Math.min(200, linesRef.current * 20)}px`,
          overflowY: linesRef.current * 20 < 200 ? "hidden" : "auto",
        }}
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
