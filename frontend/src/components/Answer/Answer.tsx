import { useEffect, useMemo, useState, useContext } from "react";
import { useBoolean } from "@fluentui/react-hooks";

import { AskResponse, Citation, Feedback, historyMessageFeedback } from "../../api";
import { parseAnswer } from "./AnswerParser";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import supersub from 'remark-supersub'
import { Link, Button, Caption1, Card, CardFooter, Text, Checkbox, CheckboxOnChangeData, CardHeader, Dialog, DialogSurface, DialogTitle, Subtitle2, DialogActions } from "@fluentui/react-components";
import { AnswerStyles } from "./AnswerStyles";
import { ChevronDown24Regular, ChevronRight24Regular, ThumbDislike20Filled, ThumbLike20Filled, ThumbLike20Regular, ThumbDislike20Regular } from "@fluentui/react-icons";
import { AppStateContext } from "../../state/AppProvider";

interface Props {
    answer: AskResponse;
    onCitationClicked: (citedDocument: Citation) => void;
}

export const Answer = ({
    answer,
    onCitationClicked
}: Props) => {
    const styles = AnswerStyles();

    const initializeAnswerFeedback = (answer: AskResponse) => {
        if (answer.message_id == undefined) return undefined;
        if (answer.feedback == undefined) return undefined;
        if (Object.values(Feedback).includes(answer.feedback)) return answer.feedback;
        return Feedback.Neutral;
    }

    const [isRefAccordionOpen, { toggle: toggleIsRefAccordionOpen }] = useBoolean(false);
    const filePathTruncationLimit = 50;

    const parsedAnswer = useMemo(() => parseAnswer(answer), [answer]);
    const [chevronIsExpanded, setChevronIsExpanded] = useState(isRefAccordionOpen);

    const [feedbackState, setFeedbackState] = useState(initializeAnswerFeedback(answer));
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
    const [showReportInappropriateFeedback, setShowReportInappropriateFeedback] = useState(false);
    const [negativeFeedbackList, setNegativeFeedbackList] = useState<Feedback[]>([]);
    const appStateContext = useContext(AppStateContext);
    const FEEDBACK_ENABLED = appStateContext?.state.frontendSettings?.feedback_enabled;

    const handleChevronClick = () => {
        setChevronIsExpanded(!chevronIsExpanded);
        toggleIsRefAccordionOpen();
    };

    useEffect(() => {
        setChevronIsExpanded(isRefAccordionOpen);
    }, [isRefAccordionOpen]);

    useEffect(() => {
        console.log("USE EFFECT: ", answer, FEEDBACK_ENABLED);
        if (answer.message_id == undefined) return;

        let currentFeedbackState;
        if (appStateContext?.state.feedbackState && appStateContext?.state.feedbackState[answer.message_id]) {
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
                citationFilename = `${citation.filepath.substring(0, 20)}...${citation.filepath.substring(citationLength - 20)} - Part ${parseInt(citation.chunk_id) + 1}`;
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

        let newFeedbackState = feedbackState;
        // Set or unset the thumbs up state
        if (feedbackState == Feedback.Positive) {
            newFeedbackState = Feedback.Neutral;
        }
        else {
            newFeedbackState = Feedback.Positive;
        }
        appStateContext?.dispatch({ type: 'SET_FEEDBACK_STATE', payload: { answerId: answer.message_id, feedback: newFeedbackState } });
        setFeedbackState(newFeedbackState);

        // Update message feedback in db
        await historyMessageFeedback(answer.message_id, newFeedbackState);
    }

    const onDislikeResponseClicked = async () => {
        if (answer.message_id == undefined) return;

        let newFeedbackState = feedbackState;
        if (feedbackState === undefined || feedbackState === Feedback.Neutral || feedbackState === Feedback.Positive) {
            newFeedbackState = Feedback.Negative;
            setFeedbackState(newFeedbackState);
            setIsFeedbackDialogOpen(true);
        } else {
            // Reset negative feedback to neutral
            newFeedbackState = Feedback.Neutral;
            setFeedbackState(newFeedbackState);
            await historyMessageFeedback(answer.message_id, Feedback.Neutral);
        }
        appStateContext?.dispatch({ type: 'SET_FEEDBACK_STATE', payload: { answerId: answer.message_id, feedback: newFeedbackState } });
    }

    const updateFeedbackList = (ev: React.ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
        if (answer.message_id == undefined) return;
        let selectedFeedback = (ev?.target as HTMLInputElement)?.id as Feedback;

        let feedbackList = negativeFeedbackList.slice();
        if (data.checked) {
            feedbackList.push(selectedFeedback);
        } else {
            feedbackList = feedbackList.filter((f) => f !== selectedFeedback);
        }

        setNegativeFeedbackList(feedbackList);
    }


    const onSubmitNegativeFeedback = async () => {
        if (answer.message_id == undefined) return;
        await historyMessageFeedback(answer.message_id, negativeFeedbackList.join(","));
        resetFeedbackDialog();
    }

    const resetFeedbackDialog = () => {
        setIsFeedbackDialogOpen(false);
        setShowReportInappropriateFeedback(false);
        setNegativeFeedbackList([]);
    }

    const UnhelpfulFeedbackContent = () => {
        return (<>
            <div>Why wasn't this response helpful?</div>
            <div className={styles.feedbackCheckboxContainer}>
                <Checkbox label="Citations are missing" id={Feedback.MissingCitation} defaultChecked={negativeFeedbackList.includes(Feedback.MissingCitation)} onChange={updateFeedbackList}></Checkbox>
                <Checkbox label="Citations are wrong" id={Feedback.WrongCitation} defaultChecked={negativeFeedbackList.includes(Feedback.WrongCitation)} onChange={updateFeedbackList}></Checkbox>
                <Checkbox label="The response is not from my data" id={Feedback.OutOfScope} defaultChecked={negativeFeedbackList.includes(Feedback.OutOfScope)} onChange={updateFeedbackList}></Checkbox>
                <Checkbox label="Inaccurate or irrelevant" id={Feedback.InaccurateOrIrrelevant} defaultChecked={negativeFeedbackList.includes(Feedback.InaccurateOrIrrelevant)} onChange={updateFeedbackList}></Checkbox>
                <Checkbox label="Other" id={Feedback.OtherUnhelpful} defaultChecked={negativeFeedbackList.includes(Feedback.OtherUnhelpful)} onChange={updateFeedbackList}></Checkbox>
            </div>
            <Link as="a" onClick={() => setShowReportInappropriateFeedback(true)}>Report inappropriate content</Link>
        </>);
    }

    const ReportInappropriateFeedbackContent = () => {
        return (
            <>
                <div>The content is <span style={{ color: "red" }} >*</span></div>
                <div className={styles.feedbackCheckboxContainer}>
                    <Checkbox label="Hate speech, stereotyping, demeaning" id={Feedback.HateSpeech} defaultChecked={negativeFeedbackList.includes(Feedback.HateSpeech)} onChange={updateFeedbackList}></Checkbox>
                    <Checkbox label="Violent: glorification of violence, self-harm" id={Feedback.Violent} defaultChecked={negativeFeedbackList.includes(Feedback.Violent)} onChange={updateFeedbackList}></Checkbox>
                    <Checkbox label="Sexual: explicit content, grooming" id={Feedback.Sexual} defaultChecked={negativeFeedbackList.includes(Feedback.Sexual)} onChange={updateFeedbackList}></Checkbox>
                    <Checkbox label="Manipulative: devious, emotional, pushy, bullying" defaultChecked={negativeFeedbackList.includes(Feedback.Manipulative)} id={Feedback.Manipulative} onChange={updateFeedbackList}></Checkbox>
                    <Checkbox label="Other" id={Feedback.OtherHarmful} defaultChecked={negativeFeedbackList.includes(Feedback.OtherHarmful)} onChange={updateFeedbackList}></Checkbox>
                </div>
            </>
        );
    }

    return (
        <>
            <Card
                tabIndex={0}
                className={styles.card}
            >
                <CardHeader
                    action={
                        (FEEDBACK_ENABLED && answer.message_id !== undefined) ?
                            <div className={styles.feedbackButtonContainer}>
                                <Button
                                    appearance="transparent"
                                    aria-hidden="false"
                                    aria-label="Like this response"
                                    onClick={() => onLikeResponseClicked()}
                                    icon={feedbackState === Feedback.Positive || appStateContext?.state.feedbackState[answer.message_id] === Feedback.Positive ?
                                        <ThumbLike20Filled /> :
                                        <ThumbLike20Regular />
                                    }
                                />
                                <Button
                                    appearance="transparent"
                                    aria-hidden="false"
                                    aria-label="Dislike this response"
                                    onClick={() => onDislikeResponseClicked()}
                                    icon={(feedbackState !== Feedback.Positive && feedbackState !== Feedback.Neutral && feedbackState !== undefined) ?
                                        <ThumbDislike20Filled /> :
                                        <ThumbDislike20Regular />
                                    }
                                />
                            </div>
                            :
                            <>  </>
                    }
                >
                </CardHeader>
                <div>
                    <ReactMarkdown
                        linkTarget="_blank"
                        remarkPlugins={[remarkGfm, supersub]}
                        children={parsedAnswer.markdownFormatText}
                        className={styles.answerText}
                    />
                </div>
                <div className={styles.answerFooter}>
                    {!!parsedAnswer.citations.length && (
                        <div
                            onKeyDown={e => e.key === "Enter" || e.key === " " ? toggleIsRefAccordionOpen() : null}
                        >
                            <div>
                                <div className={styles.citationHeader}>
                                    <Text
                                        className={styles.accordionTitle}
                                        onClick={toggleIsRefAccordionOpen}
                                        aria-label="Open references"
                                        tabIndex={0}
                                        role="button"
                                    >
                                        <span>{parsedAnswer.citations.length > 1 ? parsedAnswer.citations.length + " references" : "1 reference"}</span>
                                    </Text>
                                    <Button
                                        appearance="transparent"
                                        onClick={handleChevronClick}
                                        icon={chevronIsExpanded ? <ChevronDown24Regular /> : <ChevronRight24Regular />}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {chevronIsExpanded &&
                    <div className={styles.citationListContainer}>
                        {parsedAnswer.citations.map((citation, idx) => {
                            return (
                                <Card
                                    appearance="outline"
                                    title={createCitationFilepath(citation, ++idx)}
                                    tabIndex={0}
                                    role="link"
                                    key={idx}
                                    onClick={() => onCitationClicked(citation)}
                                    onKeyDown={e => e.key === "Enter" || e.key === " " ? onCitationClicked(citation) : null}
                                    aria-label={createCitationFilepath(citation, idx)}
                                >
                                    <div className={styles.citationCardContent}>
                                        <div>{`${idx} - `}</div>
                                        {createCitationFilepath(citation, idx, true)}
                                    </div>
                                </Card>);
                        })}
                    </div>
                }
                <CardFooter>
                    <Caption1><i>AI-generated content may be incorrect</i></Caption1>
                </CardFooter>
            </Card>
            <Dialog
                onOpenChange={() => {
                    resetFeedbackDialog();
                    setFeedbackState(Feedback.Neutral);
                }}
                open={isFeedbackDialogOpen}
            >
                <DialogSurface>
                    <DialogTitle>
                        Submit Feedback
                    </DialogTitle>
                    <Subtitle2>Your feedback will improve this experience.</Subtitle2>
                    <div className={styles.feedbackDialogBody}>
                        {!showReportInappropriateFeedback ? <UnhelpfulFeedbackContent /> : <ReportInappropriateFeedbackContent />}
                        <div>By pressing submit, your feedback will be visible to the application owner.</div>
                    </div>
                    <DialogActions>
                        <Button disabled={negativeFeedbackList.length < 1} onClick={onSubmitNegativeFeedback}>Submit</Button>
                    </DialogActions>
                </DialogSurface>
            </Dialog>
        </>
    );
};
