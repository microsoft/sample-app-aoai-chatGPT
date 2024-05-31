import * as React from 'react';
import { SuggestionButtonStyles } from './SuggestionButtonStyles';
import { Button, Subtitle2 } from '@fluentui/react-components';

export interface ISuggestionButtonsProps {
    onButtonClick: (questionText: string) => void;
}

const questions = [
    `Explain the key challenges tackled by MSR in Research Forum Episode 3.`,
    `Which emerging technologies were highlighted in Research Forum Episode 3?`,
    `Detail significant insights discussed at each Research Forum episode to-date.`,
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