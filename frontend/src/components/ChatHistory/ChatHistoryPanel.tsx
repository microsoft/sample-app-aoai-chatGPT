
import { useBoolean } from '@fluentui/react-hooks';

import { useContext } from "react";
import { AppStateContext } from "../../state/AppProvider";
import React from "react";
import ChatHistoryList from "./ChatHistoryList";
import { ChatHistoryLoadingState, historyDeleteAll } from "../../api";
import { Text, Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderNavigation, Menu, MenuList, MenuPopover, MenuTrigger, Title3, Toolbar, ToolbarButton, Dialog, Spinner, DialogSurface, DialogTitle, DialogActions, DialogBody } from "@fluentui/react-components";
import { Delete24Regular, Dismiss24Regular, MoreHorizontal24Filled } from "@fluentui/react-icons";
import { ChatHistoryStyles } from "./ChatHistoryStyles";

interface ChatHistoryPanelProps {
    open: boolean | undefined;
}

export enum ChatHistoryPanelTabs {
    History = "History"
}

export function ChatHistoryPanel(props: ChatHistoryPanelProps) {
    const styles = ChatHistoryStyles();
    const appStateContext = useContext(AppStateContext);
    const [showDrawer, setShowDrawer] = React.useState(false);
    const [hideClearAllDialog, { toggle: toggleClearAllDialog }] = useBoolean(true);
    const [clearing, setClearing] = React.useState(false)
    const [clearingError, setClearingError] = React.useState(false)

    const handleHistoryClick = () => {
        appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' })
    };

    const onClearAllChatHistory = async () => {
        setClearing(true)
        let response = await historyDeleteAll()
        if (!response.ok) {
            setClearingError(true)
        } else {
            appStateContext?.dispatch({ type: 'DELETE_CHAT_HISTORY' })
            toggleClearAllDialog();
        }
        setClearing(false);
    }

    const onHideClearAllDialog = () => {
        toggleClearAllDialog()
        setTimeout(() => {
            setClearingError(false)
        }, 2000);
    }

    React.useEffect(() => { }, [appStateContext?.state.chatHistory, clearingError]);

    React.useEffect(() => {
        setShowDrawer(props.open ?? false)
    }, [props.open]);

    return (
        <>
            <Drawer
                open={showDrawer}
                aria-label={"chat history panel"}
                position='end'
                type='overlay'
                style={{ width: '380px' }}
            >
                <DrawerHeader className={styles.panelHeader}>
                    <Title3>Chat History</Title3>
                    <DrawerHeaderNavigation>
                        <Toolbar>
                            <Menu>
                                <MenuTrigger>
                                    <ToolbarButton aria-label="More" icon={<MoreHorizontal24Filled />} />
                                </MenuTrigger>
                                <MenuPopover>
                                    <MenuList>
                                        <Button
                                            onClick={toggleClearAllDialog}
                                            icon={<Delete24Regular />}
                                        >
                                            Clear all chat history
                                        </Button>
                                    </MenuList>
                                </MenuPopover>
                            </Menu>
                            <ToolbarButton
                                icon={<Dismiss24Regular />}
                                title={"Hide"}
                                onClick={handleHistoryClick}
                                aria-label={"hide button"}
                                role="button"
                            />
                        </Toolbar>
                    </DrawerHeaderNavigation>
                </DrawerHeader>
                <DrawerBody>
                    <div className={styles.drawerBody} aria-label="chat history panel content">

                        <div>
                            {
                                (appStateContext?.state?.chatHistoryLoadingState === ChatHistoryLoadingState.Success && appStateContext?.state?.isCosmosDBAvailable?.cosmosDB) && <ChatHistoryList />
                            }
                            {
                                (appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Fail && appStateContext?.state.isCosmosDBAvailable) && <>
                                    <div>
                                        <div style={{ width: "100%", marginTop: 10 }}>
                                            <div>
                                                <Text style={{ alignSelf: 'center' }}>
                                                    {appStateContext?.state.isCosmosDBAvailable?.status && <span>{appStateContext?.state.isCosmosDBAvailable?.status}</span>}
                                                    {!appStateContext?.state.isCosmosDBAvailable?.status && <span>Error loading chat history</span>}

                                                </Text>
                                            </div>
                                            <div>
                                                <Text style={{ alignSelf: 'center' }}>
                                                    <span>Chat history can't be saved at this time</span>
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            }
                            {
                                appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Loading && <>
                                    <div>
                                        <div style={{ width: "100%", marginTop: 10 }}>
                                            <div style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                <Spinner style={{ alignSelf: "flex-start", height: "100%", marginRight: "5px" }} />
                                            </div>
                                            <div>
                                                <Text style={{ alignSelf: 'center' }}>
                                                    <span style={{ whiteSpace: 'pre-wrap' }}>Loading chat history</span>
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </DrawerBody>
            </Drawer>
            <Dialog
                open={!hideClearAllDialog}
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Clear all chat history?</DialogTitle>
                        <DialogActions>
                            {!clearingError && <Button appearance='primary' onClick={onClearAllChatHistory} disabled={clearing} >Clear all </Button>}
                            <Button onClick={onHideClearAllDialog} disabled={clearing}>{!clearingError ? "Cancel" : "Close"}</Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </>
    );
}