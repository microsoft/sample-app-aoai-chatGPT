import { SpeechConfig, AutoDetectSourceLanguageConfig, AudioConfig, SpeechRecognizer, SpeechSynthesizer, ResultReason, SpeakerAudioDestination } from "microsoft-cognitiveservices-speech-sdk";
import { AskResponse, SpeechAuth } from "./models";
import { getSpeechAuthToken } from "./api";

export class AudioService {
    public recognizer: SpeechRecognizer | undefined;
    private synthesiser: SpeechSynthesizer | undefined;
    private autoDetectSourceLanguageConfig = AutoDetectSourceLanguageConfig.fromLanguages(["en-US", "de-DE", "zh-CN", "nl-NL"]);
    private audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    private speechConfig: SpeechConfig | undefined;
    private speechToken: SpeechAuth | undefined;

    private audioDestination = new SpeakerAudioDestination();
    
    private currentSpokenText: {
        message_id: string | undefined;
        text: string | undefined;
    } = {
            message_id: undefined,
            text: undefined,
        };

    constructor() {
        this.createResources();
    }

    private createResources = async () => {
        this.speechToken = await getSpeechAuthToken();
        if (!this.speechToken) {
            throw new Error('Speech was cancelled. Auth token cannot be retrieved.');
        } else {
            this.speechConfig = SpeechConfig.fromAuthorizationToken(this.speechToken.access_token, this.speechToken.region);
            this.recognizer = SpeechRecognizer.FromConfig(this.speechConfig, this.autoDetectSourceLanguageConfig, this.audioConfig);
            this.synthesiser = new SpeechSynthesizer(this.speechConfig);
        }
    }

    public speakAnswer = async (answer: AskResponse): Promise<void> => {
        if (!this.synthesiser) {
            console.error('Speech was cancelled. Synthesizer cannot be retrieved.');
            return;
        }
        if (this.currentSpokenText.message_id === answer.message_id && this.currentSpokenText.text === answer.answer) {
            return;
        }
        await this.refreshSpeechToken();
        let textToSpeak = "";

        if(answer.message_id === this.currentSpokenText.message_id){
            // texttospeak will be equal to answer.answer string minus the currentSpokenText.text
            textToSpeak = answer.answer.replace(this.currentSpokenText.text || "", "");
        }
        this.currentSpokenText = {
            message_id: answer.message_id,
            text: answer.answer,
        };
        // remove markup from text
        textToSpeak = textToSpeak.replace(/<[^>]*>?/gm, '');

        this.synthesiser.speakTextAsync(textToSpeak);
    }

    public refreshSpeechToken = async (): Promise<void> => {
        if(this.speechToken?.expiresTime && this.speechToken.expiresTime > new Date()){
            return;
        }
        this.speechToken = await getSpeechAuthToken();
        if (!this.speechToken) {
            throw new Error('Speech was cancelled. Auth token cannot be retrieved.');
        } else {
            this.speechConfig = SpeechConfig.fromAuthorizationToken(this.speechToken.access_token, this.speechToken.region);
            this.recognizer = SpeechRecognizer.FromConfig(this.speechConfig, this.autoDetectSourceLanguageConfig, this.audioConfig);
            this.synthesiser = new SpeechSynthesizer(this.speechConfig);
        }
    }

    public stopAudioPlayback = (): void => { 
        // stop audio playback
        this.audioDestination.pause();
        this.audioDestination.close();
    }
}