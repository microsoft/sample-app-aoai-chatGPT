import { Button } from '@fluentui/react-components';
import { MicRecord24Filled, MicSparkle24Regular } from '@fluentui/react-icons';
import * as React from 'react';
import { AudioConfig, AutoDetectSourceLanguageConfig, ResultReason, SpeechConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';
import { MicrophoneStyles } from './MicrophoneStyles';
import { SpeechAuth, getSpeechAuthToken } from '../../api';
import { AppStateContext } from "../../state/AppProvider";

export interface IMicrophoneProps {
    onSpeech: (text: string) => void;
    onRecordingStart: () => void;
    onRecordingEnd: () => void;
    disabled: boolean;
}

let speechToken: SpeechAuth | undefined = undefined;

export const Microphone: React.FunctionComponent<IMicrophoneProps> = (props: React.PropsWithChildren<IMicrophoneProps>) => {
    const styles = MicrophoneStyles();
    const appStateContext = React.useContext(AppStateContext);
    const [microphoneActive, setmicrophoneActive] = React.useState<boolean>(false);
    const [microphoneDisabled, setmicrophoneDisabled] = React.useState<boolean>(props.disabled);

    React.useEffect(() => {
        setmicrophoneDisabled(props.disabled);
    }, [props.disabled]);

    const getTextFromSpeech = async (): Promise<void> => {
        setmicrophoneActive(true);
        setmicrophoneDisabled(true);
        props.onRecordingStart();

        if (appStateContext?.state.audioService?.recognizer) {
            try {
                appStateContext?.state.audioService.refreshSpeechToken();
                appStateContext?.state.audioService.recognizer.recognizeOnceAsync(result => {
                    if (result.reason === ResultReason.RecognizedSpeech) {
                        props.onSpeech(result.text);
                        props.onRecordingEnd();
                        setmicrophoneActive(false);
                        setmicrophoneDisabled(false);
                    } else {
                        console.error('Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
                        props.onRecordingEnd();
                        setmicrophoneActive(false);
                        setmicrophoneDisabled(false);
                    }
                }
                );
            } catch (error) {
                console.error('Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
                props.onRecordingEnd();
                setmicrophoneActive(false);
                setmicrophoneDisabled(false);
            }
        }
    };

    const onMicrophoneClick = async () => {
        // stop audio playback
        appStateContext?.state.audioService?.stopAudioPlayback();
        getTextFromSpeech();
    };

    return (
        <>
            <Button
                title="Start recording"
                appearance='transparent'
                size='large'
                aria-label="Start recording"
                icon={
                    microphoneActive ?
                        <MicRecord24Filled className={styles.micIconRecording} />
                        :
                        <MicSparkle24Regular className={microphoneDisabled ? "" : styles.microphone} />
                }
                onClick={onMicrophoneClick}
                disabled={microphoneDisabled}
            />
        </>
    );
};