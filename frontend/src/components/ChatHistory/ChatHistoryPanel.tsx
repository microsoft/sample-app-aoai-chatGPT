import { CommandBar, CommandBarButton, ContextualMenu, IButtonProps, ICommandBarItemProps, ICommandBarStyles, IContextualMenuItem, IContextualMenuProps, IStackStyles, Pivot, PivotItem, SearchBox, Stack, StackItem, Text } from "@fluentui/react";
import { useConst } from '@fluentui/react-hooks';

import styles from "./ChatHistoryPanel.module.css"
import { useContext } from "react";
import { AppStateContext } from "../../state/AppProvider";
import React from "react";
import ChatHistoryList from "./ChatHistoryList";

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

    return (
        <section className={styles.container} data-is-scrollable aria-label={"history"}>
            <Stack horizontal horizontalAlign='space-between' verticalAlign='center' wrap>
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
                        onItemClick={onHideContextualMenu}
                        onDismiss={onHideContextualMenu}
                    />
                    <CommandBarButton
                        iconProps={{ iconName: 'Cancel' }}
                        title={"Hide"}
                        onClick={handleHistoryClick}
                        aria-label={"hide button"}
                        // hidden={}
                        styles={commandBarStyle}
                        role="button"
                    />
                </Stack>
                {/* <SearchBox
                    styles={{ root: { width: 200 } }}
                    placeholder="Search"
                    onEscape={ev => {
                    console.log('Custom onEscape Called');
                    }}
                    onClear={ev => {
                    console.log('Custom onClear Called');
                    }}
                    onChange={(_, newValue) => console.log('SearchBox onChange fired: ' + newValue)}
                    onSearch={newValue => console.log('SearchBox onSearch fired: ' + newValue)}
                /> */}
                </Stack>
            </Stack>
                <Stack aria-label="Chat History"
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
                    <Stack>
                        <ChatHistoryList/>
                    </Stack>
                </Stack>
        </section>
    );
}