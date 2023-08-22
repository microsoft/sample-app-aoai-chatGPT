import { CommandBar, CommandBarButton, ContextualMenu, DefaultButton, Dialog, DialogFooter, DialogType, IButtonProps, ICommandBarItemProps, ICommandBarStyles, IContextualMenuItem, IContextualMenuProps, IStackStyles, Pivot, PivotItem, PrimaryButton, SearchBox, Stack, StackItem, Text } from "@fluentui/react";
import { useBoolean, useConst } from '@fluentui/react-hooks';

import styles from "./ChatHistoryPanel.module.css"
import { useContext } from "react";
import { AppStateContext } from "../../state/AppProvider";
import React from "react";
import ChatHistoryList from "./ChatHistoryList";
import { historyDeleteAll } from "../../api";

interface ChatHistoryPanelProps {

}

export enum ChatHistoryPanelTabs {
    History = "History"
}

const commandBarStyle: ICommandBarStyles = {
    root: {
        padding: '0',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },
};

const commandBarButtonStyle: Partial<IStackStyles> = { root: { height: '50px' } };

export function ChatHistoryPanel(props: ChatHistoryPanelProps) {
    const appStateContext = useContext(AppStateContext)
    const [showContextualMenu, setShowContextualMenu] = React.useState(false);
    const [hideClearAllDialog, { toggle: toggleClearAllDialog }] = useBoolean(true);

    const dialogContentProps = {
        type: DialogType.close,
        title: 'Are you sure you want to clear all chat history?',
        closeButtonAriaLabel: 'Close',
        subText: 'All chat history will be permanently removed.',
    };

    const modalProps = {
        titleAriaId: 'labelId',
        subtitleAriaId: 'subTextId',
        isBlocking: true,
        styles: { main: { maxWidth: 450 } },
    }

    const menuItems: IContextualMenuItem[] = [
        { key: 'clearAll', text: 'Clear all chat history', iconProps: { iconName: 'Delete' }},
    ];

    const handleHistoryClick = () => {
        appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' })
    };
    
    const onShowContextualMenu = React.useCallback((ev: React.MouseEvent<HTMLElement>) => {
        ev.preventDefault(); // don't navigate
        setShowContextualMenu(true);
    }, []);

    const onHideContextualMenu = React.useCallback(() => setShowContextualMenu(false), []);

    const onClearAllChatHistory = async () => {
        try {
            await historyDeleteAll()
            appStateContext?.dispatch({ type: 'DELETE_CHAT_HISTORY' })
            setSearchText('')
        } catch (error) {
            console.error("Error: ", error)
        }
        toggleClearAllDialog();
    }

    const [searchText, setSearchText] = React.useState('');
    const onSearchChange = (ev: any) => {
        if(!ev?.target?.value){
            setSearchText('')
            appStateContext?.dispatch({ type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: null })
            return
        }
        const newValue = ev.target.value;
        setSearchText(newValue);
        if(!newValue){
            appStateContext?.dispatch({ type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: null })
        }
        
        if(appStateContext?.state.chatHistory){
            const filtered = appStateContext?.state.chatHistory.filter(conversation =>
                conversation.title.toLowerCase().includes(newValue.toLowerCase())
            );
            
            if(filtered.length > 0){
                appStateContext?.dispatch({ type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: filtered })
            }else{
                appStateContext?.dispatch({ type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: [] })
            }
        }
    }

    React.useEffect(() => {}, [appStateContext?.state.chatHistory]);

    return (
        <section className={styles.container} data-is-scrollable aria-label={"chat history panel"}>
            <Stack horizontal horizontalAlign='space-between' verticalAlign='center' wrap aria-label="chat history header">
                <StackItem>
                    <Text role="heading" aria-level={2} style={{ alignSelf: "center", fontWeight: "600", fontSize: "18px", marginRight: "auto", paddingLeft: "20px" }}>Chat history</Text>
                </StackItem>
                <Stack verticalAlign="start">
                    <Stack horizontal styles={commandBarButtonStyle}>
                        <CommandBarButton
                            iconProps={{ iconName: 'More' }}
                            title={"Clear all chat history"}
                            onClick={onShowContextualMenu}
                            aria-label={"clear all chat history"}
                            styles={commandBarStyle}
                            role="button"
                            id="moreButton"
                        />
                        <ContextualMenu
                            items={menuItems}
                            hidden={!showContextualMenu}
                            target={"#moreButton"}
                            onItemClick={toggleClearAllDialog}
                            onDismiss={onHideContextualMenu}
                        />
                        <CommandBarButton
                            iconProps={{ iconName: 'Cancel' }}
                            title={"Hide"}
                            onClick={handleHistoryClick}
                            aria-label={"hide button"}
                            styles={commandBarStyle}
                            role="button"
                        />
                    </Stack>
                </Stack>
            </Stack>
            {/* <Stack >
                <SearchBox
                    value={searchText}
                    className={styles.searchBox}
                    placeholder="Search"
                    onClear={ev => {
                        setSearchText('')
                        // set filter groups to null
                        appStateContext?.dispatch({ type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: null })
                    }}
                    onChange={(ev) => onSearchChange(ev)}
                />
            </Stack> */}
            <Stack aria-label="chat history panel content"
                styles={{
                    root: {
                        display: "flex",
                        flexGrow: 1,
                        flexDirection: "column",
                        paddingTop: '2.5px',
                        maxWidth: "100%"
                    },
                }}
                style={{
                    display: "flex",
                    flexGrow: 1,
                    flexDirection: "column",
                    flexWrap: "wrap",
                    padding: "1px"
                }}>
                <Stack className={styles.chatHistoryListContainer}>
                    <ChatHistoryList/>
                </Stack>
            </Stack>
            <Dialog
                hidden={hideClearAllDialog}
                onDismiss={toggleClearAllDialog}
                dialogContentProps={dialogContentProps}
                modalProps={modalProps}
            >
                <DialogFooter>
                <PrimaryButton onClick={onClearAllChatHistory} text="Clear All" />
                <DefaultButton onClick={toggleClearAllDialog} text="Cancel" />
                </DialogFooter>
            </Dialog>
        </section>
    );
}