import { useState } from "react";
import {
  Stack,
  TextField,
  Image,
  CommandBarButton,
  TooltipHost,
  ITooltipHostStyles,
} from "@fluentui/react";
import { SendRegular } from "@fluentui/react-icons";
import Send from "../../assets/Send.svg";
import styles from "./QuestionInput.module.css";

interface Props {
  onSend: (question: string, id?: string) => void;
  onTextboxClear: () => void;
  disabled: boolean;
  placeholder?: string;
  clearOnSend?: boolean;
  conversationId?: string;
  imageSrc?: string;
}

export const QuestionInput = ({
  onSend,
  disabled,
  placeholder,
  clearOnSend,
  conversationId,
  imageSrc,
  onTextboxClear,
}: Props) => {
  const [question, setQuestion] = useState<string>("");

  const sendQuestion = () => {
    if ((disabled || !question.trim()) && !imageSrc) {
      return;
    }

    if (conversationId) {
      onSend(question, conversationId);
    } else {
      onSend(question);
    }

    if (clearOnSend) {
      setQuestion("");
    }
  };

  const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
    if (
      ev.key === "Enter" &&
      !ev.shiftKey &&
      !(ev.nativeEvent?.isComposing === true)
    ) {
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

  const disabledButton = () => sendQuestionDisabled && !imageSrc;

  const inlineBlockStyle: Partial<ITooltipHostStyles> = {
    root: { display: "inline-block" },
  };

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      {imageSrc && (
        <Image src={imageSrc} className={styles.questionInputAttachedImage} />
      )}

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
      <CommandBarButton
        role="button"
        styles={{
          icon: {
            color: "#2d87c3",
            fontSize: "22px",
          },
          iconDisabled: {
            color: "#BDBDBD !important",
          },
          rootDisabled: {
            background: "transparent",
          },
        }}
        onClick={() => {
          setQuestion("");
          onTextboxClear();
        }}
        className={styles.questionInputClearButtonContainer}
        iconProps={{ iconName: "Delete" }}
        disabled={disabledButton()}
        aria-label="clear chat button"
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
        {sendQuestionDisabled && !imageSrc ? (
          <SendRegular className={styles.questionInputSendButtonDisabled} />
        ) : (
          <img src={Send} className={styles.questionInputSendButton} />
        )}
      </div>

      <div className={styles.questionInputBottomBorder} />
    </Stack>
  );
};
