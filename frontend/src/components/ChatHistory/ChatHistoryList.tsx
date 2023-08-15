import { GroupedList, IGroup, IGroupHeaderProps, IRenderFunction, List, mergeStyleSets } from '@fluentui/react';
import React, { useContext } from 'react';
import { AppStateContext, ChatEntry } from '../../state/AppProvider';
import { ChatHistoryListItemGroups } from './ChatHistoryListItem';

interface ChatHistoryListProps {}

export interface GroupedChatHistory {
    month: string;
    entries: ChatEntry[]
}

const groupByMonth = (entries: ChatEntry[]) => {
    const groups: GroupedChatHistory[] = [];
  
    entries.forEach((entry) => {
        const date = new Date(entry.date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' })
        const existingGroup = groups.find((group) => group.month === monthYear);
  
        if (existingGroup) {
            existingGroup.entries.push(entry);
        } else {
            groups.push({ month: monthYear, entries: [entry] });
        }
    });
  
    return groups;
};

const ChatHistoryList: React.FC<ChatHistoryListProps> = () => {
  const appStateContext = useContext(AppStateContext);
  const chatHistory = appStateContext?.state.chatHistory;
  let groupedChatHistory;
  if(chatHistory){
    groupedChatHistory = groupByMonth(chatHistory);
  }else{
    return <div>No history</div>
  }
  
  return (
    <ChatHistoryListItemGroups groupedChatHistory={groupedChatHistory}/>
  );
};

export default ChatHistoryList;
