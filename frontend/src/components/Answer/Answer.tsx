import { Stack, Text } from '@fluentui/react';
import { useMemo } from 'react';

import styles from './Answer.module.css';

import { AskResponse } from '../../api';
import { parseAnswer } from './AnswerParser';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import supersub from 'remark-supersub';

interface Props {
  answer: AskResponse;
}

export const Answer = ({ answer }: Props) => {
  const parsedAnswer = useMemo(() => parseAnswer(answer), [answer]);

  const { citations, documentLinks } = parsedAnswer;

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
                  <Text className={styles.accordionTitle}>
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

        {documentLinks.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {documentLinks.map((documentLink, idx) => {
              return (
                <a
                  title={documentLink.title}
                  href={documentLink.url}
                  target="_blank"
                  tabIndex={0}
                  role="link"
                  key={idx}
                  className={styles.citationContainer}
                  aria-label={documentLink.title}
                >
                  <div className={styles.citation}>{idx + 1}</div>
                  {documentLink.truncatedTitle}
                </a>
              );
            })}
          </div>
        )}
      </Stack>
    </>
  );
};
