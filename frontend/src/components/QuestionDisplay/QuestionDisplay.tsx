import * as React from 'react';
import { Body1, Card } from '@fluentui/react-components';
import { QuestionDisplayStyles } from './QuestionDisplayStyles';

export interface IQuestionDisplayProps {
    content: string;
}

export const QuestionDisplay: React.FunctionComponent<IQuestionDisplayProps> = (props: React.PropsWithChildren<IQuestionDisplayProps>) => {
    const styles = QuestionDisplayStyles();
    return (
        <Card
            tabIndex={0}
            className={styles.card}
        >
            <Body1 align="end">{props.content}</Body1>
        </Card>
    );
};
