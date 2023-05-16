import { useEffect, useMemo, useState } from "react";
import { useBoolean } from "@fluentui/react-hooks"
import { FontIcon, Stack, Text } from "@fluentui/react";

import styles from "./Answer.module.css";

import { AskResponse, DocumentResult } from "../../api";
import { parseAnswerToJsx } from "./AnswerParser";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import supersub from 'remark-supersub'

interface Props {
    answer: AskResponse;
    onCitationClicked: (citedDocument: DocumentResult) => void;
}

export const Answer = ({
    answer,
    onCitationClicked
}: Props) => {
    const [isRefAccordionOpen, { toggle: toggleIsRefAccordionOpen }] = useBoolean(false);
    const onInlineCitationClicked = () => {
        if (!isRefAccordionOpen) {
            toggleIsRefAccordionOpen();
        }
    };

    const useMarkdownFormat = true; // set to false to use inline clickable citations without markdown formatting

    const parsedAnswer = useMemo(() => parseAnswerToJsx(answer, onInlineCitationClicked), [answer]);
    const [chevronIsExpanded, setChevronIsExpanded] = useState(isRefAccordionOpen);

    const handleChevronClick = () => {
        setChevronIsExpanded(!chevronIsExpanded);
        toggleIsRefAccordionOpen();
      };

    useEffect(() => {
        setChevronIsExpanded(isRefAccordionOpen);
    }, [isRefAccordionOpen]);

    const createCitationFilepath = (citation: DocumentResult) => {
        let citationDisplay = "";

        if (citation.filepath) {
            citationDisplay = citation.filepath;
        }
        else if (citation.title) {
            citationDisplay = citation.title;
        }

        if (citation.chunk_id !== null) {
            citationDisplay += ` - Part ${parseInt(citation.chunk_id) + 1}`;
        }
        return citationDisplay;
    }

    return (
        <>
            <Stack className={styles.answerContainer}>
                <Stack.Item grow>
                    {useMarkdownFormat ? ( 
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, supersub]}
                            children={parsedAnswer.markdownFormatText}
                            className={styles.answerText}
                        /> ) : ( 
                        <p className={styles.answerText}>{parsedAnswer.answerJsx}</p>)}
                </Stack.Item>
                <Stack horizontal className={styles.answerFooter}>
                {!!parsedAnswer.citations.length && (
                    <Stack.Item aria-label="References">
                        <Stack style={{width: "100%"}} >
                            <Stack horizontal horizontalAlign='start' verticalAlign='center'>
                                <Text
                                    className={styles.accordionTitle}
                                    onClick={toggleIsRefAccordionOpen}
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
                                <span key={idx} onClick={() => onCitationClicked(citation)} className={styles.citationContainer}>
                                    <div className={styles.citation}>{++idx}</div>
                                    {createCitationFilepath(citation)}
                                </span>);
                        })}
                    </div>
                }
            </Stack>
        </>
    );
};
