import { GroupedList, IGroup, IGroupHeaderProps, IRenderFunction, List, mergeStyleSets } from '@fluentui/react';
import React, { useContext } from 'react';
import { AppStateContext } from '../../state/AppProvider';
import { ChatHistoryListItemGroups } from './ChatHistoryListItem';
import { Conversation } from '../../api/models';

interface ChatHistoryListProps {}

export interface GroupedChatHistory {
    month: string;
    entries: Conversation[]
}

const groupByMonth = (entries: Conversation[]) => {
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

    groups.sort((a, b) => {
        const dateA = new Date(a.entries[0].date);
        const dateB = new Date(b.entries[0].date);
        return dateB.getTime() - dateA.getTime();
    });
  
    return groups;
};

const ChatHistoryList: React.FC<ChatHistoryListProps> = () => {
    const appStateContext = useContext(AppStateContext);
    const chatHistory = appStateContext?.state.chatHistory;

    React.useEffect(() => {}, [appStateContext?.state.chatHistory]);
    
    let groupedChatHistory;
    if(chatHistory && chatHistory.length > 0){
        groupedChatHistory = groupByMonth(chatHistory);
    }else{
        return <div>No history</div>
    }
    
    return (
        <ChatHistoryListItemGroups groupedChatHistory={groupedChatHistory}/>
    );
};

export default ChatHistoryList;
