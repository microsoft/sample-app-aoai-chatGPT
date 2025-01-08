import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, getChatResponse } from '../../api';
import { CitationPanel } from './CitationPanel';

interface ChatProps {
    initialMessage?: string;
}

export const Chat: React.FC<ChatProps> = ({ initialMessage }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialMessage) {
            handleSendMessage(initialMessage);
        }
    }, []);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: content
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await getChatResponse({
                messages: [...messages, userMessage]
            });

            const assistantMessage = response.choices[0].messages[0];
            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3/4 p-3 rounded-lg ${
                            message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                        }`}>
                            <p>{message.content}</p>
                            {message.citations && <CitationPanel citations={message.citations} />}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-3/4 p-3 rounded-lg bg-gray-100">
                            <p>Thinking...</p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="flex justify-center">
                        <div className="max-w-3/4 p-3 rounded-lg bg-red-100 text-red-600">
                            <p>{error}</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                }}>
                    <div className="flex space-x-4">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 p-2 border rounded-lg"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputMessage.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};