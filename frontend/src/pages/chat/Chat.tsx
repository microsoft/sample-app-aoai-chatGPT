import { useRef, useState, useEffect } from "react";
import { Pivot, PivotItem } from "@fluentui/react";
import { Sparkle28Filled, Sparkle48Filled } from "@fluentui/react-icons";

import styles from "./Chat.module.css";

import {
    ChatMessage,
    ConversationRequest,
    conversationApi,
    MessageContent,
    DocumentResult
} from "../../api";
import { Answer } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { SupportingContent } from "../../components/SupportingContent";
import { ClearChatButton } from "../../components/ClearChatButton";

enum Tabs {
    SupportingContentTab = "supportingContent",
    CitationTab = "citation"
}

const Chat = () => {
    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [activeCitation, setActiveCitation] = useState<[content: string, id: string, title: string, filepath: string, url: string, metadata: string]>();
    const [activeTab, setActiveTab] = useState<Tabs | undefined>(undefined);

    const [currentAnswer, setCurrentAnswer] = useState<number>(0);
    const [answers, setAnswers] = useState<[message_id: string, parent_message_id: string, role: string, content: MessageContent][]>(
        []
    );

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveTab(undefined);

        try {
            const prevMessages: ChatMessage[] = answers.map(a => ({
                message_id: a[0],
                parent_message_id: a[1] ?? "",
                role: a[2],
                content: a[3]
            }));
            const userMessage: ChatMessage = {
                message_id: crypto.randomUUID(),
                parent_message_id: prevMessages.length > 0 ? prevMessages[prevMessages.length - 1].message_id : "",
                role: "user",
                content: {
                    content_type: "text",
                    parts: [question],
                    top_docs: [],
                    intent: ""
                }
            };

            const request: ConversationRequest = {
                messages: [...prevMessages, userMessage]
            };

            const result = await conversationApi(request);

            setAnswers([
                ...answers,
                [userMessage.message_id, userMessage.parent_message_id ?? "", userMessage.role, userMessage.content],
                [result.message_id, result.parent_message_id ?? "", result.role, result.content]
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        lastQuestionRef.current = "";
        setActiveCitation(undefined);
        setAnswers([]);
    };

    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }), [isLoading]);

    const onShowCitation = (citation: DocumentResult, index: number) => {
        setCurrentAnswer(index);
        if (activeCitation && activeCitation[1] === citation.id && activeTab === Tabs.CitationTab) {
            setActiveTab(undefined);
        } else {
            setActiveCitation([citation.content, citation.id, citation.title ?? "", citation.filepath ?? "", "", ""]);
            setActiveTab(Tabs.CitationTab);
        }
    };

    const isDisabledCitationTab: boolean = !activeCitation;

    return (
        <div className={styles.container}>
            <div className={styles.commandsContainer}>
                <ClearChatButton className={styles.commandButton} onClick={clearChat} disabled={!lastQuestionRef.current || isLoading} />
            </div>
            <div className={styles.chatRoot}>
                <div className={styles.chatContainer}>
                    {!lastQuestionRef.current ? (
                        <div className={styles.chatEmptyState}>
                            <Sparkle48Filled aria-hidden="true" className={styles.chatSparkleIcon}/>
                            <h1 className={styles.chatEmptyStateTitle}>Start chatting</h1>
                            <h2 className={styles.chatEmptyStateSubtitle}>This chatbot is configured to answer your questions.</h2>
                        </div>
                    ) : (
                        <div className={styles.chatMessageStream}>
                            {answers.map((answer, index) => (
                                <>
                                    {answer[2] === "user" ? (
                                        <div className={styles.chatMessageUser}>
                                            <div className={styles.chatMessageUserMessage}>{answer[3].parts[0]}</div>
                                        </div>
                                    ) : (
                                        <div className={styles.chatMessageGpt}>
                                            <Answer
                                                answer={{
                                                    answer: answer[3].parts[0],
                                                    thoughts: null,
                                                    data_points: [],
                                                    top_docs: answer[3].top_docs
                                                }}
                                                onCitationClicked={c => onShowCitation(c, index)}
                                            />
                                        </div>
                                    )}
                                </>
                            ))}
                            {isLoading && (
                                <>
                                    <div className={styles.chatMessageUser}>
                                        <div className={styles.chatMessageUserMessage}>{lastQuestionRef.current}</div>
                                    </div>
                                    <div className={styles.chatMessageGptLoading}>
                                        <Sparkle28Filled aria-hidden="true" aria-label="Answer logo" />
                                        <p>Generating answer...</p>
                                    </div>
                                </>
                            )}
                            <div ref={chatMessageStreamEnd} />
                        </div>
                    )}

                    <div className={styles.chatInput}>
                        <QuestionInput
                            clearOnSend
                            placeholder="Type a new question..."
                            disabled={isLoading}
                            onSend={question => makeApiRequest(question)}
                        />
                    </div>
                </div>

                {!isLoading && answers.length > 0 && activeTab && (
                    <Pivot
                        className={styles.chatAnalysisPanel}
                        selectedKey={activeTab}
                        onLinkClick={pivotItem => pivotItem && setActiveTab(pivotItem.props.itemKey! as Tabs)}
                    >
                        <PivotItem
                            itemKey={Tabs.CitationTab}
                            headerText="Citation"
                            headerButtonProps={isDisabledCitationTab ? { disabled: true, style: { color: "grey" } } : undefined}
                        >
                            { activeCitation && <SupportingContent supportingContent={{
                                content: activeCitation[0], 
                                id: activeCitation[1],
                                title: activeCitation[2],
                                filepath: activeCitation[3],
                                url: activeCitation[4],
                                metadata: activeCitation[5]
                            }} />}
                        </PivotItem>
                    </Pivot>
                )}
            </div>
        </div>
    );
};

export default Chat;
