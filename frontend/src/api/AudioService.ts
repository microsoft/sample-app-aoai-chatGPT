import { SpeechConfig, AutoDetectSourceLanguageConfig, AudioConfig, SpeechRecognizer, SpeechSynthesizer, ResultReason, SpeakerAudioDestination } from "microsoft-cognitiveservices-speech-sdk";
import { AskResponse, SpeechAuth } from "./models";
import { getSpeechAuthToken } from "./api";

export class AudioService {
    public recognizer: SpeechRecognizer | undefined;
    private synthesiser: SpeechSynthesizer | undefined;
    private autoDetectSourceLanguageConfig = AutoDetectSourceLanguageConfig.fromLanguages(["en-US", "de-DE", "zh-CN", "nl-NL"]);
    private recognizerAudioConfig = AudioConfig.fromDefaultMicrophoneInput();
    private audioPlayer = new SpeakerAudioDestination();
    private synthesiserAudioConfig = AudioConfig.fromSpeakerOutput(this.audioPlayer);
    private speechConfig: SpeechConfig | undefined;
    private speechToken: SpeechAuth | undefined;

    private currentSpokenText: {
        message_id: string | undefined;
        text: string | undefined;
    } = {
            message_id: "genenerating",
            text: undefined
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
            this.recognizer = SpeechRecognizer.FromConfig(this.speechConfig, this.autoDetectSourceLanguageConfig, this.recognizerAudioConfig);
            this.synthesiser = new SpeechSynthesizer(this.speechConfig, this.synthesiserAudioConfig);
        }

    }

    public speakAnswer = async (answer: AskResponse): Promise<void> => {
        if (!this.synthesiser) {
            console.error('Speech was cancelled. Synthesizer cannot be retrieved.');
            return;
        }
        if(answer.message_id === undefined || answer.answer === undefined) {
            return;
        }
        if (this.currentSpokenText.message_id === answer.message_id && this.currentSpokenText.text === answer.answer) {
            return;
        }
        // refresh token checks if token is expired and gets a new one if it is
        await this.refreshSpeechToken();
        let textToSpeak = "";

        if (answer.message_id === this.currentSpokenText.message_id) {
            // texttospeak will be equal to answer.answer string minus the currentSpokenText.text
            textToSpeak = answer.answer.replace(this.currentSpokenText.text || "", "");
        }
        if (answer.message_id !== this.currentSpokenText.message_id) {
            console.log("New synthesiser! New message IDs:", answer.message_id, " , ",this.currentSpokenText.message_id);
            console.log("ANSWER", answer.answer);
            this.createNewSynthesiser();
        }
        this.currentSpokenText = {
            message_id: answer.message_id,
            text: answer.answer
        };
        // remove markup from text
        textToSpeak = textToSpeak.replace(/<[^>]*>?/gm, '');
        // get audio data 

        this.synthesiser.speakTextAsync(textToSpeak);
    }

    public refreshSpeechToken = async (): Promise<void> => {
        if (this.speechToken?.expiresTime && this.speechToken.expiresTime > new Date()) {
            return;
        }
        this.speechToken = await getSpeechAuthToken();
        if (!this.speechToken) {
            throw new Error('Speech was cancelled. Auth token cannot be retrieved.');
        } else {
            this.speechConfig = SpeechConfig.fromAuthorizationToken(this.speechToken.access_token, this.speechToken.region);
            this.recognizer = SpeechRecognizer.FromConfig(this.speechConfig, this.autoDetectSourceLanguageConfig, this.recognizerAudioConfig);
            this.synthesiser = new SpeechSynthesizer(this.speechConfig, this.synthesiserAudioConfig);
        }
    }

    public stopAudioPlayback = (): void => {
        this.audioPlayer.internalAudio.pause();
    }

    private createNewSynthesiser = (): void => {
        this.audioPlayer.internalAudio.pause();
        this.audioPlayer.close();
        this.synthesiser?.close();
        this.audioPlayer = new SpeakerAudioDestination();
        this.synthesiserAudioConfig = AudioConfig.fromSpeakerOutput(this.audioPlayer);
        if (this.speechConfig) {
            this.synthesiser = new SpeechSynthesizer(this.speechConfig, this.synthesiserAudioConfig);
        }
    }
}