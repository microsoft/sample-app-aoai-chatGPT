import * as React from 'react';
import { ITheme, IconButton, List, Separator, getFocusStyle, getTheme, mergeStyleSets } from '@fluentui/react';
import { ChatEntry } from '../../state/AppProvider'; // Adjust the import path
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
  },
  chatEntry: {
    padding: 4,
  },
  chatDate: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: '16px 0',
  },
  chatMessages: {
    marginLeft: 16,
  },
  chatMessage: {
    marginBottom: 8,
  },
});

const formatMonth = (month: string) => {
  return month.toUpperCase();
};

export const ChatHistoryListItemCell: React.FC<ChatHistoryListItemCellProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  if (!item) {
    return null; // Do not render the cell if item is undefined
  }

  const cellStyles = mergeStyleSets({
    chatEntry: {
      padding: 4,
      backgroundColor: isSelected ? '#e6e6e6' : 'transparent', // Highlight on selection
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#e6e6e6'
      }
    },
    buttons: {
      display: isSelected ? 'block' : 'none',
      marginTop: 8,
    },
});

const theme: ITheme = getTheme();
const { palette, semanticColors, fonts } = theme;

const classNames = mergeStyleSets({
  itemCell: [
    getFocusStyle(theme, { inset: -1 }),
    {
      minHeight: 54,
      padding: 10,
      boxSizing: 'border-box',
    //   borderBottom: `1px solid ${semanticColors.bodyDivider}`,
      display: 'flex',
      selectors: {
        '&:hover': { background: palette.neutralLight },
      },
    },
  ],
  itemImage: {
    flexShrink: 0,
  },
  itemContent: {
    marginLeft: 10,
    overflow: 'hidden',
    flexGrow: 1,
  },
  itemName: [
    fonts.xLarge,
    {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  ],
  itemIndex: {
    fontSize: fonts.small.fontSize,
    color: palette.neutralTertiary,
    marginBottom: 10,
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: 10,
    color: palette.neutralTertiary,
    fontSize: fonts.large.fontSize,
    flexShrink: 0,
  },
});

  const onDelete = () => {
    // Implement your delete logic here
    console.log(`Delete item with title: ${item.title}`);
  };

  const onEdit = () => {
    // Implement your edit logic here
    console.log(`Edit item with title: ${item.title}`);
  };

  return (
    <div className={classNames.itemCell} onClick={() => onSelect(item)}>
      <div>{item.title}</div>
      <div className={cellStyles.buttons}>
        <IconButton iconProps={{ iconName: 'Delete' }} title="Delete" onClick={onDelete} />
        <IconButton iconProps={{ iconName: 'Edit' }} title="Edit" onClick={onEdit} />
      </div>
    </div>
  );
};

export const ChatHistoryListItemGroups: React.FC<ChatHistoryListItemGroupsProps> = ({ groupedChatHistory }) => {
  const [selectedItem, setSelectedItem] = React.useState<ChatEntry | null>(null);

  const onRenderCell = (item?: ChatEntry) => {
    return (
      <ChatHistoryListItemCell item={item} isSelected={item === selectedItem} onSelect={setSelectedItem} />
    );
  };

  return (
    <div>
      {groupedChatHistory.map((group) => (
        <div key={group.month} className={styles.chatGroup}>
          <div className={styles.chatDate}>{formatMonth(group.month)}</div>
          <List items={group.entries} onRenderCell={onRenderCell} />
          <Separator />
        </div>
      ))}
    </div>
  );
};
