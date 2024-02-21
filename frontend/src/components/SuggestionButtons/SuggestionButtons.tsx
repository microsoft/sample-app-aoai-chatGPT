import * as React from 'react';
import { SuggestionButtonStyles } from './SuggestionButtonStyles';
import { Button, Subtitle2 } from '@fluentui/react-components';

export interface ISuggestionButtonsProps {
    onButtonClick: (questionText: string) => void;
}


const questions = [
    `How can AI help disrupt mental constructs?`,
    `Can AI help me be more successful?`,
    `How might AI and wellness converge harmoniously?`,
    `What are some daily steps to reducing stress?`,
]

export const SuggestionButtons: React.FunctionComponent<ISuggestionButtonsProps> = (props: React.PropsWithChildren<ISuggestionButtonsProps>) => {
    const styles = SuggestionButtonStyles();
    return (
    <div className={styles.container}>
        <Subtitle2><i>Get started with an example question below:</i></Subtitle2>
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