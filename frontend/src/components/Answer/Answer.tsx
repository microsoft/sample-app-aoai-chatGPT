import { Stack, Text } from '@fluentui/react';
import { useMemo } from 'react';

import styles from './Answer.module.css';

import { AskResponse, Citation } from '../../api';
import { parseAnswer } from './AnswerParser';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import supersub from 'remark-supersub';

interface Props {
  answer: AskResponse;
}

export const Answer = ({ answer }: Props) => {
  const filePathTruncationLimit = 44;
  const parsedAnswer = useMemo(() => parseAnswer(answer), [answer]);

  const { citations } = parsedAnswer;

  const createCitationFilepath = (citation: Citation, index: number, truncate: boolean = false) => {
    let citationFilename = '';

    if (citation.filepath && citation.chunk_id) {
      if (truncate && citation.filepath.length > filePathTruncationLimit) {
        const citationLength = citation.filepath.length;
        citationFilename = `${citation.filepath.substring(0, 20)}...${citation.filepath.substring(citationLength - 20)}`;
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

  return (
    <>
      <Stack className={styles.answerContainer} tabIndex={0}>
        <Stack.Item grow>
          <ReactMarkdown
            linkTarget="_blank"
            remarkPlugins={[remarkGfm, supersub]}
            children={parsedAnswer.markdownFormatText}
            className={styles.answerText}
          />
        </Stack.Item>

        <Stack horizontal className={styles.answerFooter}>
          {!!parsedAnswer.citations.length && (
            <Stack.Item>
              <Stack style={{ width: '100%' }}>
                <Stack horizontal horizontalAlign="start" verticalAlign="center">
                  <Text className={styles.accordionTitle} aria-label="Open references" tabIndex={0} role="button">
                    <span>{citations.length > 1 ? citations.length + ' references' : '1 reference'}</span>
                  </Text>
                </Stack>
              </Stack>
            </Stack.Item>
          )}
          <Stack.Item className={styles.answerDisclaimerContainer}>
            <span className={styles.answerDisclaimer}>AI-generated content may be incorrect</span>
          </Stack.Item>
        </Stack>

        <div style={{ marginTop: 8, display: 'flex', flexFlow: 'wrap column', maxHeight: '150px', gap: '4px' }}>
          {citations.map((citation, idx) => {
            return (
              <a
                title={createCitationFilepath(citation, ++idx)}
                href={citation.url!}
                target="_blank"
                tabIndex={0}
                role="link"
                key={idx}
                className={styles.citationContainer}
                aria-label={createCitationFilepath(citation, idx)}
              >
                {createCitationFilepath(citation, idx, true)}
              </a>
            );
          })}
        </div>
      </Stack>
    </>
  );
};
