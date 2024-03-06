import * as React from 'react';
import { SuggestionButtonStyles } from './SuggestionButtonStyles';
import { Button, Subtitle2 } from '@fluentui/react-components';

export interface ISuggestionButtonsProps {
    onButtonClick: (questionText: string) => void;
}

const questions = [
    `Can you summarize the key challenges tackled by MSR in this year's Research Forum?`,
    `Which emerging technologies did MSR highlight in their "lightning" research talks?`,
    `What kind of problems is MSR's AI research trying to solve for everyday people?`,
]

export const SuggestionButtons: React.FunctionComponent<ISuggestionButtonsProps> = (props: React.PropsWithChildren<ISuggestionButtonsProps>) => {
    const styles = SuggestionButtonStyles();
    return (
    <div className={styles.container}>
        <span className={styles.prompt}><i>Get started with an example question below:</i></span>
        {
            questions.map((questionText, index) => {
                return (
                    <Button appearance='subtle' size='small' key={index} onClick={() => props.onButtonClick(questionText)}>{questionText}</Button>
                )
            })
        }
    </div>
  );
};