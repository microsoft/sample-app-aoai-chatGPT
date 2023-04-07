import { useRef, useState } from "react";
import { Pivot, PivotItem, Spinner} from "@fluentui/react";

import styles from "./OneShot.module.css";

import { 
    ChatMessage, 
    ConversationRequest, 
    conversationApi, 
    MessageContent, 
    FeedbackString, 
    FeedbackRequest, 
    feedbackApi, 
    DocumentResult 
} from "../../api";
import { Answer } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { SupportingContent } from "../../components/SupportingContent";

enum Tabs {
    ThoughtProcessTab = "thoughtProcess",
    SupportingContentTab = "supportingContent",
    CitationTab = "citation"
}

const OneShot = () => {
    const lastQuestionRef = useRef<string>("");

    const [error, setError] = useState<unknown>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [answer, setAnswer] = useState<[message_id: string, parent_message_id: string, role: string, content: MessageContent, feedback: FeedbackString]>();
    const [activeCitation, setActiveCitation] = useState<[content: string, id: string, title: string, filepath: string, url: string, metadata: string]>();
    const [activeTab, setActiveTab] = useState<Tabs | undefined>(undefined);

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);

        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveTab(undefined);

        try {
            
            const userMessage: ChatMessage = {
                message_id: crypto.randomUUID(),
                parent_message_id: "", 
                role: "user",
                content: {
                    content_type: "text",
                    parts: [question],
                    top_docs: [],
                    intent: ""
                }
            };

            const request: ConversationRequest = {
                messages: [userMessage]
            };

            const result = await conversationApi(request);

            setAnswer([result.message_id, result.parent_message_id ?? "", result.role, result.content, FeedbackString.Neutral]);
        } finally {
            setIsLoading(false);
        }
    };

    const makeFeedbackRequest = async (message_id: string, feedback: FeedbackString) => {
        const request: FeedbackRequest = {
            message_id: message_id,
            feedback: feedback
        };

        await feedbackApi(request);

        return;
    };

    const onShowCitation = (citation: DocumentResult) => {
        if (activeCitation && activeCitation[1] === citation.id && activeTab === Tabs.CitationTab) {
            setActiveTab(undefined);
        } else {
            setActiveCitation([citation.content, citation.id, citation.title ?? "", citation.filepath ?? "", "", ""]);
            setActiveTab(Tabs.CitationTab);
        }
    };

    const onToggleTab = (tab: Tabs) => {
        if (activeTab === tab) {
            setActiveTab(undefined);
        } else {
            setActiveTab(tab);
        }
    };

    const onLikeResponse = () => {
        if (answer) {
            let newFeedback = answer[4] === FeedbackString.ThumbsUp ? FeedbackString.Neutral : FeedbackString.ThumbsUp;
            setAnswer([answer[0], answer[1], answer[2], answer[3], newFeedback]);
            if (newFeedback === FeedbackString.ThumbsUp) {
                makeFeedbackRequest(answer[0], newFeedback);
            }
            console.log("Liked response");
        }
    };

    const onDislikeResponse = () => {
        if (answer) {
            let newFeedback = answer[4] === FeedbackString.ThumbsDown ? FeedbackString.Neutral : FeedbackString.ThumbsDown;
            setAnswer([answer[0], answer[1], answer[2], answer[3], newFeedback]);
            if (newFeedback === FeedbackString.ThumbsDown) {
                makeFeedbackRequest(answer[0], newFeedback);
            }
            console.log("Disliked response");
        }
    };

    const isDisabledCitationTab: boolean = !activeCitation;

    return (
        <div className={styles.oneshotContainer}>
            <div className={styles.oneshotTopSection}>
                <h1 className={styles.oneshotTitle}>Ask your data</h1>
                <div className={styles.oneshotQuestionInput}>
                    <QuestionInput
                        placeholder={!lastQuestionRef.current ? "Type your question here" : lastQuestionRef.current}
                        disabled={isLoading}
                        onSend={question => makeApiRequest(question)}
                    />
                </div>
            </div>
            <div className={styles.oneshotBottomSection}>
                {isLoading && <Spinner label="Generating answer" />}
                {!isLoading && answer && ( 
                    <div className={styles.oneshotAnswerContainer}>
                        <Answer
                            answer={{
                                answer: answer[3].parts[0],
                                thoughts: null,
                                data_points: [],
                                feedback: answer[4],
                                top_docs: answer[3].top_docs
                            }}
                            onCitationClicked={x => onShowCitation(x)}
                            onThoughtProcessClicked={() => onToggleTab(Tabs.ThoughtProcessTab)}
                            onSupportingContentClicked={() => onToggleTab(Tabs.SupportingContentTab)}
                            onLikeResponseClicked={() => onLikeResponse()}
                            onDislikeResponseClicked={() => onDislikeResponse()}
                        />
                    </div>
                )}
                {!isLoading && answer && activeTab && (
                    <Pivot
                        className={styles.oneshotAnalysisPanel}
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

export default OneShot;
