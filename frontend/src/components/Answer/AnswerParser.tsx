import { cloneDeep } from "lodash";
import { useContext } from "react";
import { AskResponse, Citation } from "../../api";
import { AppStateContext } from "../../state/AppProvider";

export type ParsedAnswer = {
  citations: Citation[]
  documentLinks: { url: string; title: string; truncatedTitle: string }[];
  markdownFormatText: string,
  generated_chart: string | null
} | null

export const enumerateCitations = (citations: Citation[]) => {
  const filepathMap = new Map()
  for (const citation of citations) {
    const { filepath } = citation
    let part_i = 1
    if (filepathMap.has(filepath)) {
      part_i = filepathMap.get(filepath) + 1
    }
    filepathMap.set(filepath, part_i)
    citation.part_index = part_i
  }
  return citations
}

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
  if (typeof answer.answer !== "string") return null
  let answerText = answer.answer
  const citationLinks = answerText.match(/\[(doc\d\d?\d?)]/g)

  const lengthDocN = '[doc'.length

  let filteredCitations = [] as Citation[]
  let citationReindex = 0
  citationLinks?.forEach(link => {
    // Replacing the links/citations with number
    const citationIndex = link.slice(lengthDocN, link.length - 1)
    const citation = cloneDeep(answer.citations[Number(citationIndex) - 1]) as Citation
    if (!filteredCitations.find(c => c.id === citationIndex) && citation) {
      answerText = answerText.replaceAll(link, ` ^${++citationReindex}^ `)
      citation.id = citationIndex // original doc index to de-dupe
      citation.reindex_id = citationReindex.toString() // reindex from 1 for display
      filteredCitations.push(citation)
    }
  })

  filteredCitations = enumerateCitations(filteredCitations)
    
  answerText = replaceOutScopeMessage(answerText);
  answerText = replaceCitationLinks(answerText, answer.citations);

  return {
    citations: filteredCitations,
    documentLinks: filteredCitations.map((citation, index) => ({
      url: citation.url ?? '#',
      index,
      title: createCitationFilepath(citation, index),
      truncatedTitle: createCitationFilepath(citation, index, 100),
    })),
    markdownFormatText: answerText,
    generated_chart: answer.generated_chart
  }
}

function replaceCitationLinks(answerText: string, citations: Citation[]): string {  
  return answerText.replace(/\[([^\]]+)\]\(#doc(\d+)\)/g, (match, linkText, docNumber) => {
    const newUrl = citations[docNumber - 1]?.url;
    if (newUrl) {
      return `[${linkText}](${newUrl})`;
    }
    return match;
  });
}

function replaceOutScopeMessage(answerText: string): string {
  const appStateContext = useContext(AppStateContext);
  const ui = appStateContext?.state.frontendSettings?.ui;
  const outOfScopeRegex = /Please try another query or topic\.$/;
  const outOfScopeResponse = ui?.out_of_scope_message;
  if (outOfScopeResponse && outOfScopeRegex.test(answerText)) {
    return outOfScopeResponse;
  }
  return answerText;
}
