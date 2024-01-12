import { useEffect, useMemo, useState, FormEvent, useContext } from "react";
import { useBoolean } from "@fluentui/react-hooks"
import { Checkbox, DefaultButton, Dialog, FontIcon, Stack, Text, TextField } from "@fluentui/react";
import { ThumbDislike20Filled, ThumbLike20Filled } from "@fluentui/react-icons";

import styles from "./Answer.module.css";

import { AskResponse, Citation, Feedback, FeedbackType, historyMessageFeedback } from "../../api";
import { parseAnswer } from "./AnswerParser";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import supersub from 'remark-supersub'
import { AppStateContext } from "../../state/AppProvider";

interface Props {
    answer: AskResponse;
    onCitationClicked: (citedDocument: Citation) => void;
}

export const Answer = ({
    answer,
    onCitationClicked
}: Props) => {
    const initializeAnswerFeedback = (answer: AskResponse): Feedback | undefined => {
        if (answer.message_id == undefined) return undefined;
        if (answer.feedback == undefined) return undefined;
        if (Object.values(FeedbackType).includes(answer.feedback.type as FeedbackType)) return answer.feedback;
        return {
            type: FeedbackType.Neutral,
            message: ""
        };
    }

    const [isRefAccordionOpen, { toggle: toggleIsRefAccordionOpen }] = useBoolean(false);
    const filePathTruncationLimit = 50;

    const parsedAnswer = useMemo(() => parseAnswer(answer), [answer]);
    const [chevronIsExpanded, setChevronIsExpanded] = useState(isRefAccordionOpen);
    const [feedbackState, setFeedbackState] = useState(initializeAnswerFeedback(answer));
    const [feedbackMessage, setFeedbackMessage] = useState(initializeAnswerFeedback(answer)?.message)
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
    const [showReportInappropriateFeedback, setShowReportInappropriateFeedback] = useState(false);
    const [negativeFeedbackList, setNegativeFeedbackList] = useState<FeedbackType[]>([]);
    const appStateContext = useContext(AppStateContext)
    const FEEDBACK_ENABLED = appStateContext?.state.frontendSettings?.feedback_enabled; 

    const handleChevronClick = () => {
        setChevronIsExpanded(!chevronIsExpanded);
        toggleIsRefAccordionOpen();
      };

    useEffect(() => {
        setChevronIsExpanded(isRefAccordionOpen);
    }, [isRefAccordionOpen]);

    useEffect(() => {
        if (answer.message_id == undefined) return;
        if (feedbackState === undefined) return;

        let currentFeedbackState;
        if (appStateContext?.state.feedbackState && answer.message_id in appStateContext?.state.feedbackState) {
            currentFeedbackState = appStateContext?.state.feedbackState[answer.message_id];
        } else {
            currentFeedbackState = initializeAnswerFeedback(answer);
        }
        setFeedbackState(currentFeedbackState)
    }, [appStateContext?.state.feedbackState, feedbackState, answer.message_id]);

    const createCitationFilepath = (citation: Citation, index: number, truncate: boolean = false) => {
        let citationFilename = "";

        if (citation.filepath && citation.chunk_id) {
            if (truncate && citation.filepath.length > filePathTruncationLimit) {
                const citationLength = citation.filepath.length;
                citationFilename = `${citation.filepath.substring(0, 20)}...${citation.filepath.substring(citationLength -20)} - Part ${parseInt(citation.chunk_id) + 1}`;
            }
            else {
                citationFilename = `${citation.filepath} - Part ${parseInt(citation.chunk_id) + 1}`;
            }
        }
        else if (citation.filepath && citation.reindex_id) {
            citationFilename = `${citation.filepath} - Part ${citation.reindex_id}`;
        }
        else {
            citationFilename = `Citation ${index}`;
        }
        return citationFilename;
    }

    const onLikeResponseClicked = async () => {
        if (answer.message_id == undefined) return;

        let newFeedbackState: Feedback | undefined = feedbackState;
        // Set or unset the thumbs up state
        if (feedbackState?.type == FeedbackType.Positive) {
            if (newFeedbackState) {
                newFeedbackState.type = FeedbackType.Neutral;
            }
        }
        else {
            newFeedbackState = {
                type: FeedbackType.Positive,
                message: ""
            };
        }
        appStateContext?.dispatch({ type: 'SET_FEEDBACK_STATE', payload: { answerId: answer.message_id, feedback: newFeedbackState } });
        setFeedbackState(newFeedbackState);

        // Update message feedback in db
        await historyMessageFeedback(answer.message_id, newFeedbackState);
    }

    const onDislikeResponseClicked = async () => {
        if (answer.message_id == undefined) return;

        let newFeedbackState = feedbackState;
        if (feedbackState === undefined || feedbackState.type === FeedbackType.Neutral || feedbackState.type === FeedbackType.Positive) {
            newFeedbackState = {
                type: FeedbackType.Negative,
                message: ""
            };
            setFeedbackState(newFeedbackState);
            setIsFeedbackDialogOpen(true);
        } else {
            // Reset negative feedback to neutral
            newFeedbackState = {
                type: FeedbackType.Neutral,
                message: ""
            };
            setFeedbackState(newFeedbackState);
            await historyMessageFeedback(answer.message_id, newFeedbackState);
        }
        appStateContext?.dispatch({ type: 'SET_FEEDBACK_STATE', payload: { answerId: answer.message_id, feedback: newFeedbackState }});
    }

    const updateFeedbackList = (ev?: FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        if (answer.message_id == undefined) return;
        let selectedFeedback = (ev?.target as HTMLInputElement)?.id as FeedbackType;

        let feedbackList = negativeFeedbackList.slice();
        if (checked) {
            feedbackList.push(selectedFeedback);
        } else {
            feedbackList = feedbackList.filter((f) => f !== selectedFeedback);
        }

        setNegativeFeedbackList(feedbackList);
    };

    const updateFeedbackMessage = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setFeedbackMessage(newValue || "");
    };

    const onSubmitNegativeFeedback = async () => {
        if (answer.message_id == undefined) return;
        const feedback: Feedback=  {
            type: negativeFeedbackList.join(","),
            message: feedbackMessage || ""
        }
        await historyMessageFeedback(answer.message_id, feedback);
        resetFeedbackDialog();
    }

    const resetFeedbackDialog = () => {
        setIsFeedbackDialogOpen(false);
        setShowReportInappropriateFeedback(false);
        setNegativeFeedbackList([]);
    }

    return (
        <>
            <Stack className={styles.answerContainer} tabIndex={0}>
                <Stack.Item>
                    <Stack horizontal grow>
                        <Stack.Item grow>
                            <ReactMarkdown linkTarget="_blank" remarkPlugins={[remarkGfm, supersub]} children={parsedAnswer.markdownFormatText} className={styles.answerText} />
                        </Stack.Item>
                        <Stack.Item className={styles.answerHeader}>
                            {FEEDBACK_ENABLED && answer.message_id !== undefined && <Stack horizontal horizontalAlign="space-between">
                                <ThumbLike20Filled
                                    aria-hidden="false"
                                    aria-label="Like this response"
                                    onClick={() => onLikeResponseClicked()}
                                    style={feedbackState?.type === FeedbackType.Positive ? { color: "darkgreen", cursor: "pointer" } : { color: "slategray", cursor: "pointer" }}
                                />
                                <ThumbDislike20Filled
                                    aria-hidden="false"
                                    aria-label="Dislike this response"
                                    onClick={() => onDislikeResponseClicked()}
                                    style={(feedbackState?.type !== FeedbackType.Positive && feedbackState?.type !== FeedbackType.Neutral && feedbackState !== undefined) ? { color: "darkred", cursor: "pointer" } : { color: "slategray", cursor: "pointer" }}
                                />
                            </Stack>}
                        </Stack.Item>
                    </Stack>
                </Stack.Item>



                <Stack horizontal className={styles.answerFooter}>
                {!!parsedAnswer.citations.length && (
                    <Stack.Item
                        onKeyDown={e => e.key === "Enter" || e.key === " " ? toggleIsRefAccordionOpen() : null}
                    >
                        <Stack style={{width: "100%"}} >
                            <Stack horizontal horizontalAlign='start' verticalAlign='center'>
                                <Text
                                    className={styles.accordionTitle}
                                    onClick={toggleIsRefAccordionOpen}
                                    aria-label="Open references"
                                    tabIndex={0}
                                    role="button"
                                >
                                <span>{parsedAnswer.citations.length > 1 ? parsedAnswer.citations.length + " references" : "1 reference"}</span>
                                </Text>
                                <FontIcon className={styles.accordionIcon}
                                onClick={handleChevronClick} iconName={chevronIsExpanded ? 'ChevronDown' : 'ChevronRight'}
                                />
                            </Stack>
                            
                        </Stack>
                    </Stack.Item>
                )}
                <Stack.Item className={styles.answerDisclaimerContainer}>
                    <span className={styles.answerDisclaimer}>AI-generated content may be incorrect</span>
                </Stack.Item>
                </Stack>
                {chevronIsExpanded && 
                    <div style={{ marginTop: 8, display: "flex", flexFlow: "wrap column", maxHeight: "150px", gap: "4px" }}>
                        {parsedAnswer.citations.map((citation, idx) => {
                            return (
                                <span 
                                    title={createCitationFilepath(citation, ++idx)} 
                                    tabIndex={0} 
                                    role="link" 
                                    key={idx} 
                                    onClick={() => onCitationClicked(citation)} 
                                    onKeyDown={e => e.key === "Enter" || e.key === " " ? onCitationClicked(citation) : null}
                                    className={styles.citationContainer}
                                    aria-label={createCitationFilepath(citation, idx)}
                                >
                                    <div className={styles.citation}>{idx}</div>
                                    {createCitationFilepath(citation, idx, true)}
                                </span>);
                        })}
                    </div>
                }
            </Stack>
            <Dialog 
                onDismiss={() => {
                    resetFeedbackDialog();
                    setFeedbackState({
                        type: FeedbackType.Neutral,
                        message: ""
                    });
                }}
                hidden={!isFeedbackDialogOpen}
                styles={{

                    main: [{
                        selectors: {
                          ['@media (min-width: 480px)']: {
                            maxWidth: '600px',
                            background: "#FFFFFF",
                            boxShadow: "0px 14px 28.8px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.2)",
                            borderRadius: "8px",
                            maxHeight: '600px',
                            minHeight: '100px',
                          }
                        }
                      }]
                }}
                dialogContentProps={{
                    title: "Submit Feedback",
                    showCloseButton: true
                }}
            >
                <Stack tokens={{childrenGap: 4}}>
                    <div>Your feedback will improve this experience.</div>

                    {!showReportInappropriateFeedback ? 
                        <>
                            <div>Why wasn't this response helpful?</div>
                            <Stack tokens={{childrenGap: 4}}>
                                <Checkbox label="Citations are missing" id={FeedbackType.MissingCitation} defaultChecked={negativeFeedbackList.includes(FeedbackType.MissingCitation)} onChange={updateFeedbackList}></Checkbox>
                                <Checkbox label="Citations are wrong" id={FeedbackType.WrongCitation} defaultChecked={negativeFeedbackList.includes(FeedbackType.WrongCitation)} onChange={updateFeedbackList}></Checkbox>
                                <Checkbox label="The response is not from my data" id={FeedbackType.OutOfScope} defaultChecked={negativeFeedbackList.includes(FeedbackType.OutOfScope)} onChange={updateFeedbackList}></Checkbox>
                                <Checkbox label="Inaccurate or irrelevant" id={FeedbackType.InaccurateOrIrrelevant} defaultChecked={negativeFeedbackList.includes(FeedbackType.InaccurateOrIrrelevant)} onChange={updateFeedbackList}></Checkbox>
                                <Checkbox label="Other" id={FeedbackType.OtherUnhelpful} defaultChecked={negativeFeedbackList.includes(FeedbackType.OtherUnhelpful)} onChange={updateFeedbackList}></Checkbox>
                                <TextField key="feedbackInput" multiline label="Comments" value={feedbackMessage} onChange={updateFeedbackMessage} />
                            </Stack>
                            <div onClick={() => setShowReportInappropriateFeedback(true)} className=".reportInappropriateContent">Report inappropriate content</div>
                        </> : 
                        <>
                            <div>The content is <span style={{ color: "red" }} >*</span></div>
                            <Stack tokens={{childrenGap: 4}}>
                                <Checkbox label="Hate speech, stereotyping, demeaning" id={FeedbackType.HateSpeech} defaultChecked={negativeFeedbackList.includes(FeedbackType.HateSpeech)} onChange={updateFeedbackList}></Checkbox>
                                <Checkbox label="Violent: glorification of violence, self-harm" id={FeedbackType.Violent} defaultChecked={negativeFeedbackList.includes(FeedbackType.Violent)} onChange={updateFeedbackList}></Checkbox>
                                <Checkbox label="Sexual: explicit content, grooming" id={FeedbackType.Sexual} defaultChecked={negativeFeedbackList.includes(FeedbackType.Sexual)} onChange={updateFeedbackList}></Checkbox>
                                <Checkbox label="Manipulative: devious, emotional, pushy, bullying" defaultChecked={negativeFeedbackList.includes(FeedbackType.Manipulative)} id={FeedbackType.Manipulative} onChange={updateFeedbackList}></Checkbox>
                                <Checkbox label="Other" id={FeedbackType.OtherHarmful} defaultChecked={negativeFeedbackList.includes(FeedbackType.OtherHarmful)} onChange={updateFeedbackList}></Checkbox>
                            </Stack>
                        </>}
                    <div>By pressing submit, your feedback will be visible to the application owner.</div>

                    <DefaultButton disabled={negativeFeedbackList.length < 1} onClick={onSubmitNegativeFeedback}>Submit</DefaultButton>
                </Stack>

            </Dialog>
        </>
    );
};
