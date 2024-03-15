import React, { ReactElement } from 'react';
import { FormEvent, useEffect, useMemo, useState, useContext } from "react";

import { useBoolean } from "@fluentui/react-hooks"
import { Checkbox, DefaultButton, Dialog, FontIcon, Stack, Text } from "@fluentui/react";
import DOMPurify from 'dompurify';
import { AppStateContext } from '../../state/AppProvider';

import styles from "./Answer.module.css";

import { AskResponse, Citation, Feedback, historyMessageFeedback } from "../../api";
import { parseAnswer } from "./AnswerParser";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import supersub from 'remark-supersub'
import { ThumbDislike20Filled, ThumbLike20Filled } from "@fluentui/react-icons";
import { XSSAllowTags } from "../../constants/xssAllowTags";


import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Import a syntax highlighting style
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
// Other imports remain the same

import copy from 'copy-to-clipboard';
import { FiCopy } from 'react-icons/fi';



interface Props {
    answer: AskResponse;
    onCitationClicked: (citedDocument: Citation) => void;
}

export const Answer = ({
    answer,
    onCitationClicked
}: Props) => {
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

    type CopiedStatus = {
        [key: string]: boolean;
      };
      const [copiedStatus, setCopiedStatus] = useState<CopiedStatus>({});

      

    interface CodeComponentProps {
        node: any; // More specific type if possible
        inline?: boolean;
        className?: string;
        children: React.ReactNode;
        // Add any additional props you expect to use
    }
    
    const codeComponent = ({
        node,
        inline,
        className,
        children,
        ...props
    }: CodeComponentProps): React.ReactElement | null => {
        const match = /language-(\w+)/.exec(className || '');

        if (inline) {
            return <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>{children}</code>;
        } else {
            const match = /language-(\w+)/.exec(className || '');
            if (match) {
            const language = match[1];
            const codeString = String(children).replace(/\n$/, '');
            const blockId = `block-${codeString.substring(0, 10)}`;
            const compositeKey = `${answer.message_id}-${blockId}`;
    
            const handleCopy = (messageId: string, blockId: string, codeString: string) => {
                copy(codeString);
                setCopiedStatus({ ...copiedStatus, [compositeKey]: true });
                setTimeout(() => {
                    setCopiedStatus({ ...copiedStatus, [compositeKey]: false });
                }, 3000);
            };
            
            return (
                <div style={{ position: 'relative', marginBottom: '1em' }}>
                    <div style={{
                        backgroundColor: '#000000', // Header background color
                        color: 'white', // Header text color
                        borderTopLeftRadius: '5px', // Radius to match the SyntaxHighlighter
                        borderTopRightRadius: '5px',
                        padding: '5px 10px', // Padding inside the header
                        fontFamily: 'monospace', // Font to match the code block
                    }}>
                        {language.toUpperCase()}
                    </div>
                    <SyntaxHighlighter language={language} style={dark} {...props} customStyle={{
                        margin: '0', // Remove margin around the SyntaxHighlighter
                        borderRadius: '0 0 5px 5px', // Only round the bottom corners
                        backgroundColor: '#333',
                        textShadow: 'none' ,
                        border: '1px solid #333',
                    }}>
                        {codeString}
                    </SyntaxHighlighter>
                    <button
                        onClick={() => handleCopy(answer.message_id ?? "", blockId, codeString)}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '5px',
                            zIndex: 10,
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        {copiedStatus[compositeKey] ? "Code Copied!" : <FiCopy />}
                    </button>
                </div>
            );
        }
        return null;
    };
};
    

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
        appStateContext?.dispatch({ type: 'SET_FEEDBACK_STATE', payload: { answerId: answer.message_id, feedback: newFeedbackState }});
    }

    const updateFeedbackList = (ev?: FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        if (answer.message_id == undefined) return;
        let selectedFeedback = (ev?.target as HTMLInputElement)?.id as Feedback;

        let feedbackList = negativeFeedbackList.slice();
        if (checked) {
            feedbackList.push(selectedFeedback);
        } else {
            feedbackList = feedbackList.filter((f) => f !== selectedFeedback);
        }

        setNegativeFeedbackList(feedbackList);
    };

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
            <Stack tokens={{childrenGap: 4}}>
                <Checkbox label="Citations are missing" id={Feedback.MissingCitation} defaultChecked={negativeFeedbackList.includes(Feedback.MissingCitation)} onChange={updateFeedbackList}></Checkbox>
                <Checkbox label="Citations are wrong" id={Feedback.WrongCitation} defaultChecked={negativeFeedbackList.includes(Feedback.WrongCitation)} onChange={updateFeedbackList}></Checkbox>
                <Checkbox label="The response is not from my data" id={Feedback.OutOfScope} defaultChecked={negativeFeedbackList.includes(Feedback.OutOfScope)} onChange={updateFeedbackList}></Checkbox>
                <Checkbox label="Inaccurate or irrelevant" id={Feedback.InaccurateOrIrrelevant} defaultChecked={negativeFeedbackList.includes(Feedback.InaccurateOrIrrelevant)} onChange={updateFeedbackList}></Checkbox>
                <Checkbox label="Other" id={Feedback.OtherUnhelpful} defaultChecked={negativeFeedbackList.includes(Feedback.OtherUnhelpful)} onChange={updateFeedbackList}></Checkbox>
            </Stack>
            <div onClick={() => setShowReportInappropriateFeedback(true)} style={{ color: "#115EA3", cursor: "pointer"}}>Report inappropriate content</div>
        </>);
    }

    const ReportInappropriateFeedbackContent = () => {
        return (
            <>
                <div>The content is <span style={{ color: "red" }} >*</span></div>
                <Stack tokens={{childrenGap: 4}}>
                    <Checkbox label="Hate speech, stereotyping, demeaning" id={Feedback.HateSpeech} defaultChecked={negativeFeedbackList.includes(Feedback.HateSpeech)} onChange={updateFeedbackList}></Checkbox>
                    <Checkbox label="Violent: glorification of violence, self-harm" id={Feedback.Violent} defaultChecked={negativeFeedbackList.includes(Feedback.Violent)} onChange={updateFeedbackList}></Checkbox>
                    <Checkbox label="Sexual: explicit content, grooming" id={Feedback.Sexual} defaultChecked={negativeFeedbackList.includes(Feedback.Sexual)} onChange={updateFeedbackList}></Checkbox>
                    <Checkbox label="Manipulative: devious, emotional, pushy, bullying" defaultChecked={negativeFeedbackList.includes(Feedback.Manipulative)} id={Feedback.Manipulative} onChange={updateFeedbackList}></Checkbox>
                    <Checkbox label="Other" id={Feedback.OtherHarmful} defaultChecked={negativeFeedbackList.includes(Feedback.OtherHarmful)} onChange={updateFeedbackList}></Checkbox>
                </Stack>
            </>
        );
    }
    
    
      
    

      

    return (
        <>
            <Stack className={styles.answerContainer} tabIndex={0}>
                
                <Stack.Item>
                    <Stack horizontal grow>
                        <Stack.Item grow>
                            <ReactMarkdown
                                linkTarget="_blank"
                                remarkPlugins={[remarkGfm, supersub]}
                                components={{ code: codeComponent }}
                                children={DOMPurify.sanitize(parsedAnswer.markdownFormatText, {ALLOWED_TAGS: XSSAllowTags})}
                                className={styles.answerText}
                            />
                        </Stack.Item>
                        <Stack.Item className={styles.answerHeader}>
                            {FEEDBACK_ENABLED && answer.message_id !== undefined && <Stack horizontal horizontalAlign="space-between">
                                <ThumbLike20Filled
                                    aria-hidden="false"
                                    aria-label="Like this response"
                                    onClick={() => onLikeResponseClicked()}
                                    style={feedbackState === Feedback.Positive || appStateContext?.state.feedbackState[answer.message_id] === Feedback.Positive ? 
                                        { color: "darkgreen", cursor: "pointer" } : 
                                        { color: "slategray", cursor: "pointer" }}
                                />
                                <ThumbDislike20Filled
                                    aria-hidden="false"
                                    aria-label="Dislike this response"
                                    onClick={() => onDislikeResponseClicked()}
                                    style={(feedbackState !== Feedback.Positive && feedbackState !== Feedback.Neutral && feedbackState !== undefined) ? 
                                        { color: "darkred", cursor: "pointer" } : 
                                        { color: "slategray", cursor: "pointer" }}
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
                    setFeedbackState(Feedback.Neutral);
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
                    
                    {!showReportInappropriateFeedback ? <UnhelpfulFeedbackContent/> : <ReportInappropriateFeedbackContent/>}
                    
                    <div>By pressing submit, your feedback will be visible to the application owner.</div>
                    
                    <DefaultButton disabled={negativeFeedbackList.length < 1} onClick={onSubmitNegativeFeedback}>Submit</DefaultButton>
                </Stack>
                
            </Dialog>
        </>
    );
};
