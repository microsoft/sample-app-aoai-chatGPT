import { GroupedList, IGroup, IGroupHeaderProps, IRenderFunction, List, Stack, StackItem, Text } from '@fluentui/react';
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
    const groups: GroupedChatHistory[] = [{ month: "Recent", entries: [] }];
    const currentDate = new Date();
  
    entries.forEach((entry) => {
        const date = new Date(entry.date);
        const daysDifference = (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' })
        const existingGroup = groups.find((group) => group.month === monthYear);
        
        if(daysDifference <= 7){
            groups[0].entries.push(entry);
        }else{
            if (existingGroup) {
                existingGroup.entries.push(entry);
            } else {
                groups.push({ month: monthYear, entries: [entry] });
            }
        }
    });

    groups.sort((a, b) => {
        // Check if either group has no entries and handle it
        if (a.entries.length === 0 && b.entries.length === 0) {
            return 0; // No change in order
        } else if (a.entries.length === 0) {
            return 1; // Move 'a' to a higher index (bottom)
        } else if (b.entries.length === 0) {
            return -1; // Move 'b' to a higher index (bottom)
        }
        const dateA = new Date(a.entries[0].date);
        const dateB = new Date(b.entries[0].date);
        return dateB.getTime() - dateA.getTime();
    });

    groups.forEach((group) => {
        group.entries.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
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
        return <Stack horizontal horizontalAlign='center' verticalAlign='center' style={{ width: "100%", marginTop: 10 }}>
            <StackItem>
                <Text style={{ alignSelf: 'center', fontWeight: '400', fontSize: 14 }}>
                    <span>No chat history.</span>
                </Text>
            </StackItem>
        </Stack>
    }
    
    return (
        <ChatHistoryListItemGroups groupedChatHistory={groupedChatHistory}/>
    );
};

export default ChatHistoryList;
