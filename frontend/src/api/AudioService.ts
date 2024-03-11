import { SpeechConfig, AutoDetectSourceLanguageConfig, AudioConfig, SpeechRecognizer, SpeechSynthesizer, ResultReason, SpeakerAudioDestination } from "microsoft-cognitiveservices-speech-sdk";
import { AskResponse, SpeechAuth } from "./models";
import { getSpeechAuthToken } from "./api";

export class AudioService {
    public recognizer: SpeechRecognizer | undefined;
    private synthesizer: SpeechSynthesizer | undefined;
    private autoDetectSourceLanguageConfig = AutoDetectSourceLanguageConfig.fromLanguages(["en-US", "de-DE", "zh-CN", "nl-NL"]);
    private recognizerAudioConfig = AudioConfig.fromDefaultMicrophoneInput();
    private audioPlayer = new SpeakerAudioDestination();
    private synthesizerAudioConfig = AudioConfig.fromSpeakerOutput(this.audioPlayer);
    private speechConfig: SpeechConfig | undefined;
    private speechToken: SpeechAuth | undefined;
    public audioMuted = false;

    private currentSpokenText: {
        message_id: string | undefined;
        text: string | undefined;
    } = {
            message_id: "",
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
            this.synthesizer = new SpeechSynthesizer(this.speechConfig, this.synthesizerAudioConfig);
        }

    }

    public speakAnswer = async (answer: AskResponse): Promise<void> => {
        if (!this.synthesizer) {
            console.error('Speech was cancelled. Synthesizer cannot be retrieved.');
            return;
        }
        if (answer.message_id === undefined || answer.answer === undefined) {
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
        } else {
            textToSpeak = answer.answer;
        }

        if (answer.message_id !== this.currentSpokenText.message_id) {
            this.createNewSynthesizer();
        }
        this.currentSpokenText = {
            message_id: answer.message_id,
            text: answer.answer
        };
        // remove markup from text
        textToSpeak = textToSpeak.replace(/<[^>]*>?/gm, '');

        this.synthesizer.speakTextAsync(textToSpeak);
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
            this.synthesizer = new SpeechSynthesizer(this.speechConfig, this.synthesizerAudioConfig);
        }
    }

    public stopAudioPlayback = (): void => {
        try {
            this.audioPlayer.internalAudio.pause();
        } catch (error) {
            console.error('Error stopping audio playback:', error);
        }
    }

    private createNewSynthesizer = (): void => {
        this.audioPlayer.internalAudio.pause();
        this.audioPlayer.close();
        this.synthesizer?.close();
        this.audioPlayer = new SpeakerAudioDestination();
        this.synthesizerAudioConfig = AudioConfig.fromSpeakerOutput(this.audioPlayer);
        if (this.speechConfig) {
            this.synthesizer = new SpeechSynthesizer(this.speechConfig, this.synthesizerAudioConfig);
        }
    }

    public toggleMute = (): void => {
        this.audioMuted = !this.audioMuted;
        try {
            if (this.audioMuted) {
                this.audioPlayer.mute();
            } else {
                this.audioPlayer.unmute();
            }
        } catch (error) {
            console.error('Error toggling audio mute:', error);

        }
    }
}