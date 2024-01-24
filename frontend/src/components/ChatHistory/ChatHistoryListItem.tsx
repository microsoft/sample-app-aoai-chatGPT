import * as React from 'react';

import { AppStateContext } from '../../state/AppProvider';
import { GroupedChatHistory } from './ChatHistoryList';

import { useBoolean } from '@fluentui/react-hooks';
import { Conversation } from '../../api/models';
import { historyDelete, historyRename, historyList } from '../../api';
import { useEffect, useRef, useState, useContext } from 'react';
import { ChatHistoryStyles } from './ChatHistoryStyles';
import { Body2, Button, Dialog, DialogActions, DialogBody, DialogSurface, DialogTitle, Divider, Input, Spinner, Text } from '@fluentui/react-components';
import { Checkmark20Regular, Delete20Regular, Dismiss20Regular, Edit20Regular } from '@fluentui/react-icons';
import { List, ListItem } from "@fluentui/react-migration-v0-v9";

interface ChatHistoryListItemCellProps {
    item?: Conversation;
    onSelect: (item: Conversation | null) => void;
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

    const styles = ChatHistoryStyles();
    const [isHovered, setIsHovered] = React.useState(false);
    const [edit, setEdit] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [hideDeleteDialog, { toggle: toggleDeleteDialog }] = useBoolean(true);
    const [errorDelete, setErrorDelete] = useState(false);
    const [renameLoading, setRenameLoading] = useState(false);
    const [errorRename, setErrorRename] = useState<string | undefined>(undefined);
    const [textFieldFocused, setTextFieldFocused] = useState(false);

    const appStateContext = React.useContext(AppStateContext)
    const isSelected = item?.id === appStateContext?.state.currentChat?.id;

    if (!item) {
        return null;
    }

    useEffect(() => {
        if (appStateContext?.state.currentChat?.id !== item?.id) {
            setEdit(false);
            setEditTitle('')
        }
    }, [appStateContext?.state.currentChat?.id, item?.id]);

    const onDelete = async () => {
        let response = await historyDelete(item.id)
        if (!response.ok) {
            setErrorDelete(true)
            setTimeout(() => {
                setErrorDelete(false);
            }, 5000);
        } else {
            appStateContext?.dispatch({ type: 'DELETE_CHAT_ENTRY', payload: item.id })
        }
        toggleDeleteDialog();
    };

    const onEdit = () => {
        setEdit(true)
        setTextFieldFocused(true)
        setEditTitle(item?.title)
    };

    const handleSelectItem = () => {
        onSelect(item)
        appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: item })
    }

    const truncatedTitle = (item?.title?.length > 28) ? `${item.title.substring(0, 28)} ...` : item.title;

    const handleSaveEdit = async (e: any) => {
        e.preventDefault();
        if (errorRename || renameLoading) {
            return;
        }
        if (editTitle == item.title) {
            setErrorRename("Error: Enter a new title to proceed.")
            setTimeout(() => {
                setErrorRename(undefined);
                setTextFieldFocused(true);
            }, 5000);
            return
        }
        setRenameLoading(true)
        let response = await historyRename(item.id, editTitle);
        if (!response.ok) {
            setErrorRename("Error: could not rename item")
            setTimeout(() => {
                setTextFieldFocused(true);
                setErrorRename(undefined);
                // if (textFieldRef.current) {
                //     textFieldRef.current.focus();
                // }
            }, 5000);
        } else {
            setRenameLoading(false)
            setEdit(false)
            appStateContext?.dispatch({ type: 'UPDATE_CHAT_TITLE', payload: { ...item, title: editTitle } as Conversation })
            setEditTitle("");
        }
    }

    const chatHistoryTitleOnChange = (e: any) => {
        setEditTitle(e.target.value);
    };

    const cancelEditTitle = () => {
        setEdit(false)
        setEditTitle("");
    }

    const handleKeyPressEdit = (e: any) => {
        if (e.key === "Enter") {
            return handleSaveEdit(e)
        }
        if (e.key === "Escape") {
            cancelEditTitle();
            return
        }
    }

    return (
        <div
            key={item.id}
            tabIndex={0}
            aria-label='chat history item'
            className={styles.itemCell}
            onClick={() => handleSelectItem()}
            onKeyDown={e => e.key === "Enter" || e.key === " " ? handleSelectItem() : null}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {
                edit ?
                    <div>

                        <div className={styles.historyItem}>
                            <div>

                                <Input

                                    value={editTitle}
                                    placeholder={item.title}
                                    onChange={chatHistoryTitleOnChange}
                                    onKeyDown={handleKeyPressEdit}
                                    disabled={errorRename ? true : false}
                                />
                            </div>
                            {
                                editTitle && (<div>
                                    <div aria-label='action button group' className={styles.historyItemEditButtons}>
                                        <Button role='button' disabled={errorRename !== undefined} onKeyDown={e => e.key === " " || e.key === 'Enter' ? handleSaveEdit(e) : null} onClick={(e) => handleSaveEdit(e)} aria-label='confirm new title' icon={<Checkmark20Regular />} />
                                        <Button role='button' disabled={errorRename !== undefined} onKeyDown={e => e.key === " " || e.key === 'Enter' ? cancelEditTitle() : null} onClick={() => cancelEditTitle()} aria-label='cancel edit title' icon={<Dismiss20Regular />} />
                                    </div>
                                </div>)
                            }
                        </div>
                        {
                            errorRename && (
                                <Text role='alert' aria-label={errorRename} style={{ fontSize: 12, fontWeight: 400, color: 'rgb(164,38,44)' }}>{errorRename}</Text>
                            )
                        }

                    </div> :
                    <div className={styles.historyItem}>
                        <Body2>{truncatedTitle}</Body2>
                        {(isSelected || isHovered) && <div className={styles.historyItemEditButtons}>
                            <Button icon={<Delete20Regular />} title="Delete" onClick={toggleDeleteDialog} onKeyDown={e => e.key === " " ? toggleDeleteDialog() : null} />
                            <Button icon={<Edit20Regular />} title="Edit" onClick={onEdit} onKeyDown={e => e.key === " " ? onEdit() : null} />
                        </div>}
                    </div>
            }
            {
                errorDelete && (
                    <Text>
                        Error: could not delete item
                    </Text>
                )
            }
            <Dialog
                open={!hideDeleteDialog}
                onOpenChange={toggleDeleteDialog}
            >
                <DialogSurface>
                    <DialogTitle>Are you sure you want to delete this item?</DialogTitle>
                    <DialogBody>The history of this chat session will permanently removed.</DialogBody>
                    <DialogActions>
                        <Button appearance='primary' onClick={onDelete}>Delete</Button>
                        <Button onClick={toggleDeleteDialog}>Cancel</Button>
                    </DialogActions>
                </DialogSurface>
            </Dialog>
        </div>
    );
};

export const ChatHistoryListItemGroups: React.FC<ChatHistoryListItemGroupsProps> = ({ groupedChatHistory }) => {

    const styles = ChatHistoryStyles();
    const appStateContext = useContext(AppStateContext);
    const observerTarget = useRef(null);
    const [, setSelectedItem] = React.useState<Conversation | null>(null);
    const [offset, setOffset] = useState<number>(25);
    const [observerCounter, setObserverCounter] = useState(0);
    const [showSpinner, setShowSpinner] = useState(false);
    const firstRender = useRef(true);

    const handleSelectHistory = (item?: Conversation) => {
        if (item) {
            setSelectedItem(item)
        }
    }


    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        handleFetchHistory();
        setOffset((offset) => offset += 25);
    }, [observerCounter]);

    const handleFetchHistory = async () => {
        const currentChatHistory = appStateContext?.state.chatHistory;
        setShowSpinner(true);

        await historyList(offset).then((response) => {
            const concatenatedChatHistory = currentChatHistory && response && currentChatHistory.concat(...response)
            if (response) {
                appStateContext?.dispatch({ type: 'FETCH_CHAT_HISTORY', payload: concatenatedChatHistory || response });
            } else {
                appStateContext?.dispatch({ type: 'FETCH_CHAT_HISTORY', payload: null });
            }
            setShowSpinner(false);
            return response
        })
    }

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting)
                    setObserverCounter((observerCounter) => observerCounter += 1);
            },
            { threshold: 1 }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [observerTarget]);

    return (
        <div className={styles.listContainer} data-is-scrollable>
            {
                groupedChatHistory.map((group) => (
                    group.entries.length > 0 && <div key={group.month} className={styles.chatGroup} aria-label={`chat history group: ${group.month}`}>
                        <div aria-label={group.month} className={styles.chatMonth}>{formatMonth(group.month)}</div>
                        <List
                            aria-label={`chat history list`}
                            className={styles.chatList}
                            selectable

                        >
                            {
                                group.entries.map((item, index) => {
                                    return <ListItem key={index} className={styles.listItemCell}>
                                        <ChatHistoryListItemCell
                                            item={item}
                                            onSelect={() => handleSelectHistory(item)}
                                        />
                                    </ListItem>
                                })
                            }
                        </List>
                        <div ref={observerTarget} />
                        <Divider style={{
                            width: '100%',
                            position: 'relative'
                        }} />
                    </div>
                ))
            }
            {
                showSpinner && <div className={styles.spinnerContainer}><Spinner size='small' aria-label="loading more chat history" /></div>
            }
        </div>
    );
};
