import * as React from 'react';
import { AppStateContext } from '../../state/AppProvider';
import { AskResponse } from '../../api';

export interface ISpeakTextProps {
    answer: AskResponse;
}

export const SpeakText: React.FunctionComponent<ISpeakTextProps> = (props: React.PropsWithChildren<ISpeakTextProps>) => {
    const appStateContext = React.useContext(AppStateContext);
    
    React.useEffect(() => {
            appStateContext?.state.audioService?.speakAnswer(props.answer);
    }, [props.answer]);

  return (
    <>
    </>
  );
};