import { useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { MicRegular, MicFilled, SendRegular } from "@fluentui/react-icons";
import Send from "../../assets/Send.svg";
import styles from "./QuestionInput.module.css";
import { AudioConfig, SpeechRecognizer, SpeechConfig, AutoDetectSourceLanguageConfig, ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import { getSpeechAuthToken } from "../../api";

interface Props {
    onSend: (question: string, id?: string) => void;
    disabled: boolean;
    speechEnabled?: boolean;
    placeholder?: string;
    clearOnSend?: boolean;
    conversationId?: string;
}

export const QuestionInput = ({ onSend, disabled, speechEnabled, placeholder, clearOnSend, conversationId }: Props) => {
    const [question, setQuestion] = useState<string>("");
    const [microphoneActive, setmicrophoneActive] = useState<boolean>(false);

    const sendQuestion = () => {
        if (disabled || !question.trim()) {
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
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            sendQuestion();
        }
    };

    const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setQuestion(newValue || "");
    };


    const speechToTextFromMicrophoneInput = async () => {

        if (!speechEnabled) {
            console.error('Speech disabled in environment settings.');
            return;
        }

        const auth = await getSpeechAuthToken();

        if (!auth) {
            console.error('Speech was cancelled. Auth token cannot be retrieved.');
            return;
        }

        setmicrophoneActive(true)
        const speechConfig = SpeechConfig.fromAuthorizationToken(auth.access_token, auth.region);
        const autoDetectSourceLanguageConfig = AutoDetectSourceLanguageConfig.fromLanguages(["en-US", "de-DE", "zh-CN", "nl-NL"]);
        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = SpeechRecognizer.FromConfig(speechConfig, autoDetectSourceLanguageConfig, audioConfig);

        recognizer.recognizeOnceAsync(result => {
            if (result.reason === ResultReason.RecognizedSpeech) {
                setQuestion(result.text);
            } else {
                console.error('Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
            }
            setmicrophoneActive(false);
        });
    }

    const sendQuestionDisabled = disabled || !question.trim();

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

            {speechEnabled &&
                <div className={styles.questionSpeechButtonContainer}
                    role="button"
                    tabIndex={1}
                    aria-label="Speech input button"
                    onClick={() => speechToTextFromMicrophoneInput()}
                    onKeyDown={e => e.key === "Enter" || e.key === " " ? speechToTextFromMicrophoneInput() : null}
                >
                    {microphoneActive ?
                        <MicFilled className={styles.questionSpeechButton} />
                        :
                        <MicRegular className={styles.questionSpeechButton} />
                    }
                </div>
            }

            <div className={styles.questionInputSendButtonContainer}
                role="button"
                tabIndex={0}
                aria-label="Ask question button"
                onClick={sendQuestion}
                onKeyDown={e => e.key === "Enter" || e.key === " " ? sendQuestion() : null}
            >
                {sendQuestionDisabled ?
                    <SendRegular className={styles.questionInputSendButtonDisabled} />
                    :
                    <img src={Send} className={styles.questionInputSendButton} />
                }
            </div>
            <div className={styles.questionInputBottomBorder} />
        </Stack>
    );
};
