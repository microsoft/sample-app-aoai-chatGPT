import React from 'react';
import { Citation } from '../../api';

interface CitationPanelProps {
    citations: Citation[];
}

export const CitationPanel: React.FC<CitationPanelProps> = ({ citations }) => {
    return (
        <div className="mt-2 space-y-2">
            {citations.map((citation, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-lg text-sm">
                    {citation.title && (
                        <h4 className="font-semibold">
                            {citation.url ? (
                                <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {citation.title}
                                </a>
                            ) : citation.title}
                        </h4>
                    )}
                    <p className="text-gray-700">{citation.content}</p>
                </div>
            ))}
        </div>
    );
};