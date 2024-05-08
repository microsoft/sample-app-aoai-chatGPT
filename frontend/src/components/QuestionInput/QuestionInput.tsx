import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { SendRegular } from "@fluentui/react-icons";
import Send from "../../assets/Send.svg";
import Images from "../../assets/images.svg";
import File from "../../assets/file.svg";
import styles from "./QuestionInput.module.css";
import { toast } from "react-toastify";
import Loader from "../Loader/Loader";

interface Props {
  onSend: (question: string, id?: string) => void;
  disabled: boolean;
  placeholder?: string;
  clearOnSend?: boolean;
  conversationId?: string;
  size?: number | null;
}

export const QuestionInput = ({
  onSend,
  disabled,
  placeholder,
  clearOnSend,
  conversationId,
  size = 0,
}: Props) => {
  const [question, setQuestion] = useState<string>("");
  const [fileName, setFileName] = useState<any>(null);
  const [fileText, setFileText] = useState<string>("");
  const [loader, setLoader] = useState<boolean>(false);

  const sendQuestion = () => {
    if (disabled || (fileText.trim() ? !fileText.trim() : !question.trim())) {
      return;
    }
    const fileTexts =
      question && fileText
        ? question + "\n\n" + fileText
        : question
        ? question
        : fileText
        ? fileText
        : "";

    if (conversationId) {
      onSend(fileTexts, conversationId);
    } else {
      onSend(fileTexts);
    }

    if (clearOnSend) {
      setQuestion("");
      setFileText("");
      setFileName(null);
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

  const sendQuestionDisabled =
    disabled || (fileText.trim() ? !fileText.trim() : !question.trim());

  const handleFileChange = async (e: any) => {
    e.preventDefault();
    const file = e.target.files[0];
    setFileName(file.name);
    if (!file) {
      console.error("No file selected");
      return;
    }

    // Check file type
    const allowedFileTypes = [".docx", ".pdf", ".txt"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!allowedFileTypes.includes(`.${fileExtension}`)) {
      toast.error(
        "Unsupported file type. Please upload a .docx, .pdf, or .txt file"
      );
      setFileName(null);
      return;
    }

    // Check file size
    if (size !== null) {
      // Check file size
      const fileSizeMB: number = file.size / (1024 * 1024); // Convert bytes to megabytes
      if (fileSizeMB >= size) {
        toast.error(`File size exceeds the maximum allowed size of ${size} MB`);
        setFileName(null);
        return;
      }
    }

    const formData: FormData = new FormData();
    formData.append("file", file);
    setLoader(true);
    try {
      const response: Response = await fetch("/chat/file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data: any = await response.json();

      if (!(data.content?.length > 0)) {
        toast.error(`Unable to read file`);
        setFileName(null);
      } else {
        setFileText(data.content);
      }
      setLoader(false);
    } catch (error: any) {
      toast.error("Error uploading file:", error.message);
      setLoader(false);
    }
  };

  const handelOnRemove = () => {
    setFileName(null);
    setFileText("");
  };

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      <div className={styles.file_position}>
        {loader ? (
          <Loader />
        ) : (
          <label htmlFor="fileInput" className={styles.fileInput_lable}>
            <input
              id="fileInput"
              type="file"
              accept=".docx,.pdf,.txt"
              className={styles.fileInput}
              onChange={(e: any) => {
                handleFileChange(e);
                e.target.value = null;
              }}
            />
            <img src={Images} className={styles.fileInput_Image} />
          </label>
        )}
      </div>
      <div className={styles.question_style}>
        {fileName && (
          <div className={styles.text_prompt}>
            <img src={File} className={styles.file_Icon}/>{fileName}
            <span className={styles.close} onClick={handelOnRemove}>x</span>
          </div>
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
            <SendRegular className={styles.questionInputSendButtonDisabled} />
          ) : (
            <img src={Send} className={styles.questionInputSendButton} />
          )}
        </div>
      </div>
      <div className={styles.questionInputBottomBorder} />
    </Stack>
  );
};
