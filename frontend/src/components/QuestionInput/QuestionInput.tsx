import { useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { SendRegular } from "@fluentui/react-icons";
import styles from "./QuestionInput.module.css";

interface Props {
  onSend: (question: string) => void;
  disabled: boolean;
  placeholder?: string;
  clearOnSend?: boolean;
}

export const QuestionInput = ({
  onSend,
  disabled,
  placeholder,
  clearOnSend,
}: Props) => {
  const [question, setQuestion] = useState<string>("");

  const sendQuestion = () => {
    if (disabled || !question.trim()) {
      return;
    }

    onSend(question);

    if (clearOnSend) {
      setQuestion("");
    }
  };

  const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      sendQuestion();
    }
  };

  const onQuestionChange = (
    _ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => {
    setQuestion(newValue || "");
  };

  const sendQuestionDisabled = disabled || !question.trim();

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      <TextField
        className={styles.questionInputTextArea}
        placeholder={placeholder}
        resizable={false}
        borderless
        value={question}
        onChange={onQuestionChange}
        onKeyDown={onEnterPress}
      />
      <div
        className={styles.questionInputSendButtonContainer}
        role="button"
        tabIndex={0}
        aria-label="Ask question button"
        onClick={sendQuestion}
        onKeyDown={(e) =>
          e.key === "Enter" || e.key === " " ? sendQuestion() : null
        }
      >
        {sendQuestionDisabled ? (
          <button className={styles.questionInputSendButton}>Submit</button>
        ) : (
          <button className={styles.questionInputSendButton}>Submit</button>
        )}
      </div>
    </Stack>
  );
};
