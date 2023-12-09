import { cloneDeep } from 'lodash';
import { AskResponse, Citation } from '../../api';

type ParsedAnswer = {
  citations: Citation[];
  markdownFormatText: string;
};

export function parseAnswer(answer: AskResponse): ParsedAnswer {
  const filePathTruncationLimit = 44;

  const citationsByUrl = Object.entries(
    answer.citations
      .filter((citation) => !!citation.url && !!citation.filepath)
      .map((citation) => ({ ...citation, url: citation.url!, filepath: citation.filepath! }))
      .reduce(
        (acc, obj) => ({
          ...acc,
          [obj.url]: [...(acc[obj.url] || []), obj],
        }),
        {} as { [url: string]: Citation[] }
      )
  ).map(([url, citation]) => ({
    url,
    citation,
  }));

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

  const outsideOfContextMessage = import.meta.env.VITE_OUT_OF_SCOPE_MESSAGE;
  if (
    outsideOfContextMessage &&
    answerText === 'The requested information is not available in the retrieved data. Please try another query or topic.'
  ) {
    answerText = outsideOfContextMessage;
  }
  return {
    citations: filteredCitations,
    markdownFormatText: answerText,
  };
}
