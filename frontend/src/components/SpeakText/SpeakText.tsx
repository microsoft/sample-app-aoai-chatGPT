import * as React from 'react';
import { AppStateContext } from '../../state/AppProvider';
import { AskResponse } from '../../api';
import { parseAnswer } from '../Answer/AnswerParser';

export interface ISpeakTextProps {
    answer: AskResponse;
}

export const SpeakText: React.FunctionComponent<ISpeakTextProps> = (props: React.PropsWithChildren<ISpeakTextProps>) => {
    const appStateContext = React.useContext(AppStateContext);
    
    React.useEffect(() => {
            const answer_id = props.answer.message_id;
            const answer_text = parseAnswer(props.answer).markdownFormatText;
            appStateContext?.state.audioService?.speakAnswer(answer_id ? answer_id : "", answer_text);
    }, [props.answer]);

  return (
    <>
    </>
  );
};