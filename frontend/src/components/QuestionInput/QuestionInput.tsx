import { ChangeEvent, useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { SendRegular } from "@fluentui/react-icons";
import Send from "../../assets/Send.svg";
import Images from "../../assets/images.svg";
import File from "../../assets/file.svg";
import styles from "./QuestionInput.module.css";
import { toast } from "react-toastify";

interface Props {
  onSend: (question: string, id?: string) => void;
  disabled: boolean;
  placeholder?: string;
  clearOnSend?: boolean;
  conversationId?: string;
  size?: number | null;
  ImageToTextStatus?: string | null;
  image_uploade_limit?: number | null;
}

interface ProgressState {
  [key: string]: number;
}

export const QuestionInput = ({
  onSend,
  disabled,
  placeholder,
  clearOnSend,
  conversationId,
  size = 0,
  ImageToTextStatus,
  image_uploade_limit = 3,
}: Props) => {
  const file_limit = parseInt(image_uploade_limit?.toString() ?? "3");

  const [question, setQuestion] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<ProgressState>({});
  const [fileText, setFileText] = useState<object[]>([]);
  const mapData = fileText?.map((item) => {
    return Object.entries(item);
  });
  const fileData = mapData?.map((item) => {
    return item?.[0]?.[1];
  })

  const sendQuestion = () => {
    if (
      disabled ||
      (fileData.length === 0 ? !question.trim() : !fileData.join("\n\n").trim())
    ) {
      return;
    }

    const fileTexts = fileData.join("\n\n");
    const combinedText = question ? `${fileTexts}\n\n${question}` : fileTexts;

    if (conversationId) {
      onSend(combinedText, conversationId);
    } else {
      onSend(combinedText);
    }

    if (clearOnSend) {
      setQuestion("");
      setFileText([]);
      setFiles([]);
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
    disabled ||
    (fileData.length === 0 ? !question.trim() : !fileData.join("\n\n").trim());

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (files.length + newFiles.length > file_limit) {
      toast.error(`You can only upload up to ${file_limit} files`);
      return;
    }

    newFiles?.map(async (file) => {
      const fileName = file.name;
      setFiles((prevFiles) => [...prevFiles, file]);

      // Check file type
      const allowedFileTypes = Boolean(
        ImageToTextStatus?.toLowerCase() === "true"
      )
        ? [
            ".docx",
            ".pdf",
            ".txt",
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".tiff",
            ".vtt",
            ".csv",
          ]
        : [".docx", ".pdf", ".txt"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!allowedFileTypes.includes(`.${fileExtension}`)) {
        toast.error(
          "Unsupported file type. Please upload a .docx, .pdf, or .txt file"
        );
        setFiles((prevFiles) => prevFiles.filter((f) => f.name !== file.name));
      }

      // Check file size
      if (size !== null) {
        const fileSizeMB: number = file.size / (1024 * 1024); // Convert bytes to megabytes
        if (fileSizeMB >= size) {
          toast.error(
            `File size exceeds the maximum allowed size of ${size} MB`
          );
          setFiles((prevFiles) =>
            prevFiles.filter((f) => f.name !== file.name)
          );
        }
      }

      const formData: FormData = new FormData();
      formData.append("file", file);

      try {
        await uploadFileWithProgress(file, formData);
      } catch (error: any) {
        toast.error(`Error uploading ${file.name}: ${error.message}`);
      }
    });
  };

  const uploadFileWithProgress = (file: File, formData: FormData) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/chat/file");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress((prevProgress) => ({
            ...prevProgress,
            [file.name]: percentComplete,
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          if (!(data.content?.length > 0)) {
            toast.error(`Unable to read file`);
            setFiles((prevFiles) =>
              prevFiles.filter((f) => f.name !== file.name)
            );
          } else {
            let datas = { [file.name]: data.content };
            setFileText((prevTexts) => [...prevTexts, datas]);
          }
          resolve();
        } else {
          reject(new Error(`Failed to upload file: ${file.name}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error(`Failed to upload file: ${file.name}`));
      };

      xhr.send(formData);
    });
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
    setFileText((prevTexts) =>
      prevTexts.filter((_, index) => {
        return mapData?.[index]?.[0]?.[0] !== fileName;
      })
    );
    setProgress((prevProgress) => {
      const { [fileName]: _, ...rest } = prevProgress;
      return rest;
    });
  };

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      <div className={styles.file_position}>
        <label htmlFor="fileInput" className={styles.fileInput_lable}>
          <input
            id="fileInput"
            type="file"
            multiple
            accept={
              Boolean(ImageToTextStatus?.toLowerCase() === "true")
                ? ".docx,.pdf,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.vtt,.csv"
                : ".docx,.pdf,.txt"
            }
            className={styles.fileInput}
            onChange={handleFileChange}
          />
          <img src={Images} className={styles.fileInput_Image} />
        </label>
      </div>
      <div className={styles.question_style}>
        <div className={styles.image_flex}>
          {files.map((file, index) => (
            <div key={file.name} className={styles.text_prompt}>
              {progress[file.name] === 100 ? (
                <>
                  <img src={File} className={styles.file_Icon} />
                  {file.name?.length > 12
                    ? file.name?.slice(0, 12) + "..."
                    : file.name}
                  <span
                    className={styles.close}
                    onClick={() => handleRemoveFile(file.name)}
                  >
                    x
                  </span>
                </>
              ) : (
                <div key={file.name} className={styles.circleProgressContainer}>
                  <div className={styles.circleProgress}>
                    <svg viewBox="0 0 50 50">
                      <circle
                        className={styles.circleBackground}
                        cx="25"
                        cy="25"
                        r="20"
                      ></circle>
                      <circle
                        className={styles.circleProgressIndicator}
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        strokeDasharray="125.6"
                        strokeDashoffset={
                          125.6 - (progress[file.name] || 0) * 1.256
                        } // Calculate stroke dash offset based on progress
                      ></circle>
                    </svg>
                    <text
                      className={styles.circlePercentage}
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      alignmentBaseline="central"
                    >
                      {(progress[file.name] || 0).toFixed(0)}%
                    </text>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
