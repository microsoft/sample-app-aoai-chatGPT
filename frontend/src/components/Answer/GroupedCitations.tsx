import React from 'react';
import { Stack, Text } from '@fluentui/react';
import styles from './Answer.module.css';

export interface Citation {
  filepath?: string | null;
  url?: string | null;
  title?: string;
  chunk_id?: string;
  reindex_id?: string;
  part_index?: number;
  content?: string;
  id?: string;
  metadata?: any;
  [key: string]: any; 
}

interface GroupedCitationsProps {
  citations: Citation[];
  onCitationClicked: (citation: Citation) => void;
}

const GroupedCitations: React.FC<GroupedCitationsProps> = ({ citations, onCitationClicked }) => {
  const groupedCitations = citations.reduce((acc, citation, index) => {
    const key = citation.url || citation.filepath || `unknown-${index}`;
    if (!acc[key]) {
      acc[key] = { citations: [], indices: [], title: citation.title || 'Untitled' };
    }
    acc[key].citations.push(citation);
    acc[key].indices.push(index + 1);
    return acc;
  }, {} as Record<string, { citations: Citation[], indices: number[], title: string }>);

  return (
    <div className={styles.citationWrapper}>
      {Object.entries(groupedCitations).map(([key, group], groupIndex) => (
        <div key={groupIndex} className={styles.citationGroup}>
          <span className={styles.citationIndices}>
            {group.indices.join(',')}
          </span>
          {group.citations[0].url ? (
            <a
              href={group.citations[0].url}
              className={styles.citationTitle}
              target="_blank"
              rel="noopener noreferrer"
            >
              {group.title}
            </a>
          ) 
          : (
            <Text
              className={styles.citationTitle}
              onClick={() => onCitationClicked(group.citations[0])}
            >
              {group.title}
            </Text>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupedCitations;