import { useState } from "react";
import { Send32Regular } from "@fluentui/react-icons";
import { Button, Caption1, Textarea, TextareaOnChangeData } from "@fluentui/react-components";
import { QuestionInputStyles } from "./QuestionInputStyles";
import { ComplianceMessage } from "../ComplianceMessage/ComplianceMessage";

interface Props {
    onSend: (question: string, id?: string) => void;
    disabled: boolean;
    placeholder?: string;
    clearOnSend?: boolean;
    conversationId?: string;
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, conversationId }: Props) => {
    const Newstyles = QuestionInputStyles();
    const [question, setQuestion] = useState<string>("");

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

    const onQuestionChange = (ev: React.ChangeEvent<HTMLTextAreaElement>, data: TextareaOnChangeData): void => {
        setQuestion(data.value || "");
    };

    const sendQuestionDisabled = disabled || !question.trim();

    return (
        <div className={Newstyles.container}>
            <div className={Newstyles.form}>
                <Textarea
                    className={Newstyles.textInput}
                    placeholder={placeholder}
                    rows={5}
                    value={question}
                    onChange={onQuestionChange}
                    onKeyDown={onEnterPress}
                />
                <Button
                    appearance="transparent"
                    className={Newstyles.sendButton}
                    role="button"
                    tabIndex={0}
                    aria-label="Ask question button"
                    onClick={sendQuestion}
                    onKeyDown={e => e.key === "Enter" || e.key === " " ? sendQuestion() : null}
                    icon={<Send32Regular />}
                    disabled={sendQuestionDisabled}
                />
            </div>
            <div className={Newstyles.footer}>
                <Caption1 className={Newstyles.footerText}><i>AI may generate incorrect answers, please check citations for accuracy.</i></Caption1>
                <ComplianceMessage />
            </div>
        </div>
    );
};
