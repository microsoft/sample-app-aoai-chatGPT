import * as React from 'react';
import { ITheme, IconButton, List, Separator, Stack, getFocusStyle, getTheme, mergeStyleSets } from '@fluentui/react';
import { AppStateContext, ChatEntry } from '../../state/AppProvider'; // Adjust the import path
import { GroupedChatHistory } from './ChatHistoryList'; // Adjust the import path

interface ChatHistoryListItemCellProps {
  item?: ChatEntry;
  isSelected: boolean;
  onSelect: (item: ChatEntry | null) => void;
}

interface ChatHistoryListItemGroupsProps {
  groupedChatHistory: GroupedChatHistory[];
}

const styles = mergeStyleSets({
  chatGroup: {
    // borderBottom: '1px solid #ccc',
    margin: 'auto 5px',
    width: '100%'
  },
  chatEntry: {
    padding: 4,
  },
  chatMonth: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: '5px',
    paddingLeft: '15px'
  },
  chatMessages: {
    // marginLeft: 16,
  },
  chatMessage: {
    marginBottom: 8,
  },
});

const formatMonth = (month: string) => {
  return month // month.toUpperCase();
};

export const ChatHistoryListItemCell: React.FC<ChatHistoryListItemCellProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
    const appStateContext = React.useContext(AppStateContext)
  if (!item) {
    return null; // Do not render the cell if item is undefined
  }

  const cellStyles = mergeStyleSets({
    chatEntry: {
      paddingLeft: 15,
      backgroundColor: isSelected ? '#e6e6e6' : 'transparent', // Highlight on selection
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#e6e6e6'
      }
    },
    buttons: {
    //   display: isSelected ? 'block' : 'none',
    //   marginTop: 8,
    },
    chatTitle: {
    //   display: isSelected ? 'block' : 'none',
    //   marginTop: 8,
    width: '100%',
    overFlow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    },
});

const theme: ITheme = getTheme();
const { palette, semanticColors, fonts } = theme;

const classNames = mergeStyleSets({
  itemCell: [
    getFocusStyle(theme, { inset: -1 }),
    {
      minHeight: '32px',
      cursor: 'pointer',
      paddingLeft: '15px',
      boxSizing: 'border-box',
      borderRadius: '5px',
    //   borderBottom: `1px solid ${semanticColors.bodyDivider}`,
      display: 'flex',
      selectors: {
        '&:hover': { background: '#E6E6E6' },
      },
    },
  ],
});

    const onDelete = () => {
        // Implement your delete logic here
        console.log(`Delete item with title: ${item.title}`);
    };

    const onEdit = () => {
        // Implement your edit logic here
        console.log(`Edit item with title: ${item.title}`);
    };

    const handleSelectItem = () => {
        onSelect(item)
        console.log("IsSelected: ", isSelected)
        appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: item } )
    }

    const truncatedTitle = item.title.length > 25 ? `${item.title.substring(0, 25)}...` : item.title;

  return (
    <Stack className={classNames.itemCell} onClick={() => handleSelectItem()} verticalAlign='center' horizontal>
        <Stack.Item style={{ width: '100%' }}>
            <div className={cellStyles.chatTitle}>{truncatedTitle}</div>
        </Stack.Item>
        {(item === appStateContext?.state.currentChat) && <Stack className={cellStyles.buttons} horizontal horizontalAlign='end'>
        <IconButton iconProps={{ iconName: 'Delete' }} title="Delete" onClick={onDelete} />
        <IconButton iconProps={{ iconName: 'Edit' }} title="Edit" onClick={onEdit} />
      </Stack>}
    </Stack>
  );
};

export const ChatHistoryListItemGroups: React.FC<ChatHistoryListItemGroupsProps> = ({ groupedChatHistory }) => {
  const [selectedItem, setSelectedItem] = React.useState<ChatEntry | null>(null);

  const handleSelectHistory = (item?: ChatEntry) => {
    console.log("item clicked: ", item)
    if(item){
        setSelectedItem(item)
    }
  }

  const onRenderCell = (item?: ChatEntry) => {
    return (
      <ChatHistoryListItemCell item={item} isSelected={item === selectedItem} onSelect={() => handleSelectHistory(item)} />
    );
  };

  return (
    <div>
      {groupedChatHistory.map((group) => (
        <Stack horizontalAlign="start" verticalAlign="center" key={group.month} className={styles.chatGroup}>
          <Stack className={styles.chatMonth}>{formatMonth(group.month)}</Stack>
          <List items={group.entries} onRenderCell={onRenderCell} style={{width: '100%'}} />
          <Separator />
        </Stack>
      ))}
    </div>
  );
};
