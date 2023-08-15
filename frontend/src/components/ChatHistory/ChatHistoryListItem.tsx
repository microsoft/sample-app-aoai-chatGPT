import * as React from 'react';
import { DefaultButton, Dialog, DialogFooter, DialogType, ITheme, IconButton, List, PrimaryButton, Separator, Stack, TextField, getFocusStyle, getTheme, mergeStyleSets } from '@fluentui/react';

import { AppStateContext, ChatEntry } from '../../state/AppProvider';
import { GroupedChatHistory } from './ChatHistoryList';

import styles from "./ChatHistoryPanel.module.css"
import { useBoolean } from '@fluentui/react-hooks';

interface ChatHistoryListItemCellProps {
  item?: ChatEntry;
  onSelect: (item: ChatEntry | null) => void;
}

interface ChatHistoryListItemGroupsProps {
  groupedChatHistory: GroupedChatHistory[];
}

const formatMonth = (month: string) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    const [monthName, yearString] = month.split(' ');
    const year = parseInt(yearString);

    if (year === currentYear) {
        return monthName;
    } else {
        return month;
    }
};

export const ChatHistoryListItemCell: React.FC<ChatHistoryListItemCellProps> = ({
  item,
  onSelect,
}) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [edit, setEdit] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(item?.title ?? " ");
    const [hideDeleteDialog, { toggle: toggleDeleteDialog }] = useBoolean(true);
    
    const appStateContext = React.useContext(AppStateContext)
    const isSelected = item === appStateContext?.state.currentChat;
    const dialogContentProps = {
        type: DialogType.close,
        title: 'Are you sure you want to delete this item?',
        closeButtonAriaLabel: 'Close',
        subText: 'The history of this chat session will permanently removed.',
    };

    const modalProps = {
        titleAriaId: 'labelId',
        subtitleAriaId: 'subTextId',
        isBlocking: true,
        styles: { main: { maxWidth: 450 } },
    }

    if (!item) {
        return null;
    }

    const onDelete = () => {
        appStateContext?.dispatch({ type: 'DELETE_CHAT_ENTRY', payload: item.id })
        toggleDeleteDialog();
    };

    const onEdit = () => {
        setEdit(true)
    };

    const handleSelectItem = () => {
        onSelect(item)
        appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: item } )
    }

    const truncatedTitle = item.title.length > 28 ? `${item.title.substring(0, 28)} ...` : item.title;

    const handleSaveEdit = (e: any) => {
        e.preventDefault();
        setEdit(false)
        // make api call to save
        appStateContext?.dispatch({ type: 'UPDATE_CHAT_TITLE', payload: { ...item, title: editTitle } as ChatEntry })
    }

    const chatHistoryTitleOnChange = (e: any) => {
        setEditTitle(e.target.value);
    };

    return (
        <Stack
            className={styles.itemCell}
            onClick={() => handleSelectItem()}
            verticalAlign='center'
            horizontal
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            styles={{
                root: {
                    backgroundColor: isSelected ? '#e6e6e6' : 'transparent',
                }
            }}
        >
            {edit ? <>
                <Stack.Item style={{ width: '100%' }}>
                    <form onSubmit={(e) => handleSaveEdit(e)}>
                        <TextField value={editTitle} placeholder={item.title} onChange={chatHistoryTitleOnChange}/>
                    </form>
                </Stack.Item>
            </> : <>
                <Stack.Item style={{ width: '100%' }}>
                    <div className={styles.chatTitle}>{truncatedTitle}</div>
                </Stack.Item>
                {(isSelected || isHovered) && <Stack horizontal horizontalAlign='end'>
                    <IconButton className={styles.itemButton} iconProps={{ iconName: 'Delete' }} title="Delete" onClick={toggleDeleteDialog}/>
                    <IconButton className={styles.itemButton} iconProps={{ iconName: 'Edit' }} title="Edit" onClick={onEdit} />
                </Stack>}
            </>
            }
            <Dialog
                hidden={hideDeleteDialog}
                onDismiss={toggleDeleteDialog}
                dialogContentProps={dialogContentProps}
                modalProps={modalProps}
            >
                <DialogFooter>
                <PrimaryButton onClick={onDelete} text="Delete" />
                <DefaultButton onClick={toggleDeleteDialog} text="Cancel" />
                </DialogFooter>
            </Dialog>
        </Stack>
    );
};

export const ChatHistoryListItemGroups: React.FC<ChatHistoryListItemGroupsProps> = ({ groupedChatHistory }) => {
  const [ , setSelectedItem] = React.useState<ChatEntry | null>(null);

  const handleSelectHistory = (item?: ChatEntry) => {
    if(item){
        setSelectedItem(item)
    }
  }

  const onRenderCell = (item?: ChatEntry) => {
    return (
      <ChatHistoryListItemCell item={item} onSelect={() => handleSelectHistory(item)} />
    );
  };

  return (
    <div>
      {groupedChatHistory.map((group) => (
        <Stack horizontalAlign="start" verticalAlign="center" key={group.month} className={styles.chatGroup}>
          <Stack className={styles.chatMonth}>{formatMonth(group.month)}</Stack>
          <List items={group.entries} onRenderCell={onRenderCell} className={styles.chatList}/>
          <Separator styles={{
            root: {
                width: '100%',
                position: 'relative',
                '::before': {
                  backgroundColor: '#d6d6d6',
                },
              },
          }}/>
        </Stack>
      ))}
    </div>
  );
};
