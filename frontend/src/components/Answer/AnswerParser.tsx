import { AskResponse, DocumentResult } from "../../api";
import styles from "./Answer.module.css";

type JsxParsedAnswer = {
    answerJsx: (string | JSX.Element)[];
    citations: DocumentResult[];
    markdownFormatText: string;
};

export function parseAnswerToJsx(answer: AskResponse, onInlineCitationClicked: (citedDocument: DocumentResult) => void): JsxParsedAnswer {
    let citationIndex = 0;
    const citations: DocumentResult[] = [];

    const answerText = answer.answer;
    const parts = answerText.split(/\[doc([\d]+)\]/g);
    
    let markdownFormatText = "";
    const fragments: (string | JSX.Element)[] = [];

    parts.forEach((part, index) => {
        if (index % 2 === 0) {
            fragments.push(part);
            markdownFormatText += part;
        } else {
            // match the citation to the top docs
            let citationNumber = parseInt(part.slice(-1));
            if (isNaN(citationNumber) || citationNumber > answer.top_docs.length || citationNumber <= 0) {
                fragments.push(`[doc${part}]`);
                markdownFormatText += `[doc${part}]`;
            }
            let citedDocument = answer.top_docs[citationNumber - 1];
            if (citedDocument.id === null) {
                citedDocument.id = crypto.randomUUID();
            }

            if (!citations.find((c) => c.id === citedDocument.id)) {
                citations.push(citedDocument);
                citationIndex++;
            }

            fragments.push(
                <a className={styles.citation} title={citedDocument.filepath ?? ""} onClick={() => onInlineCitationClicked(citedDocument)}>
                    <sup className={styles.clickableSup}>{citationIndex}</sup>
                </a>
            );
            markdownFormatText += ` ^${citationIndex}^ `;
        }
    });

    return {
        answerJsx: fragments,
        citations,
        markdownFormatText
    };
}
