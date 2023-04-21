import { AskResponse, DocumentResult } from "../../api";

type JsxParsedAnswer = {
    answerJsx: (string | JSX.Element)[];
    citations: DocumentResult[];
};

export function parseAnswerToJsx(answer: AskResponse, onCitationClicked: (citedDocument: DocumentResult) => void): JsxParsedAnswer {
    let citationIndex = 0;
    const citations: DocumentResult[] = [];

    const answerText = answer.answer;
    const parts = answerText.split(/\[doc([\d]+)\]/g);

    const fragments: (string | JSX.Element)[] = parts.map((part, index) => {
        if (index % 2 === 0) {
            return part;
        } else {
            // match the citation to the top docs
            let citationNumber = parseInt(part.slice(-1));
            if (isNaN(citationNumber) || citationNumber > answer.top_docs.length || citationNumber <= 0) {
                return `[doc${part}]`;
            }
            let citedDocument = answer.top_docs[citationNumber - 1];
            if (citedDocument.id === null) {
                citedDocument.id = crypto.randomUUID();
            }
            citations.push(citedDocument);
            citationIndex++;

            return (
                <a className="supContainer" title={citedDocument.filepath ?? ""} onClick={() => onCitationClicked(citedDocument)}>
                    <sup>{citationIndex}</sup>
                </a>
            );
        }
    });

    return {
        answerJsx: fragments,
        citations
    };
}
