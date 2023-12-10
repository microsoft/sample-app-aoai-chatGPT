import { cloneDeep } from 'lodash';
import { AskResponse, Citation } from '../../api';

type ParsedAnswer = {
  citations: Citation[];
  documentLinks: { url: string; title: string; truncatedTitle: string }[];
  markdownFormatText: string;
};
const createCitationFilepath = (citation: Citation, index: number, filePathTruncationLimit?: number) => {
  let citationFilename = '';

  const truncate = filePathTruncationLimit !== undefined;

  if (citation.filepath && citation.chunk_id) {
    if (truncate && citation.filepath.length > filePathTruncationLimit) {
      const halfFilePathTruncationLimit = Math.floor((filePathTruncationLimit - 3) / 2);
      const citationLength = citation.filepath.length;
      citationFilename = `${citation.filepath.substring(0, halfFilePathTruncationLimit)}...${citation.filepath.substring(
        citationLength - halfFilePathTruncationLimit
      )}`;
    } else {
      citationFilename = citation.filepath;
    }
  } else if (citation.filepath && citation.reindex_id) {
    citationFilename = citation.filepath;
  } else {
    citationFilename = `Citation ${index}`;
  }
  return citationFilename;
};

export function parseAnswer(answer: AskResponse): ParsedAnswer {
  let answerText = answer.answer;

  const citationLinks = answerText.match(/\[(doc\d\d?\d?)]/g);

  const lengthDocN = '[doc'.length;

  let filteredCitations = [] as Citation[];
  let citationReindex = 0;
  citationLinks?.forEach((link) => {
    // Replacing the links/citations with number
    let citationIndex = link.slice(lengthDocN, link.length - 1);
    let citation = cloneDeep(answer.citations[Number(citationIndex) - 1]) as Citation;
    if (!filteredCitations.find((c) => c.id === citationIndex) && citation) {
      answerText = answerText.replaceAll(link, ` ^${++citationReindex}^ `);
      citation.id = citationIndex; // original doc index to de-dupe
      citation.reindex_id = citationReindex.toString(); // reindex from 1 for display
      filteredCitations.push(citation);
    }
  });

  const outOfScopeRegex = /is not available in the retrieved documents\. Please try another query or topic\.$/;
  const outOfScopeResponse = import.meta.env.VITE_OUT_OF_SCOPE_MESSAGE;
  if (outOfScopeResponse && outOfScopeRegex.test(answerText)) {
    answerText = outOfScopeResponse;
  }

  return {
    citations: filteredCitations,
    documentLinks: filteredCitations.map((citation, index) => ({
      url: citation.url ?? '#',
      index,
      title: createCitationFilepath(citation, index),
      truncatedTitle: createCitationFilepath(citation, index, 100),
    })),
    markdownFormatText: answerText,
  };
}
