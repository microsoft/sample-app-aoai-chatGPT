import { useContext } from 'react'
import React from 'react'
import {
  CommandBarButton,
  ContextualMenu,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  ICommandBarStyles,
  IContextualMenuItem,
  IStackStyles,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  Stack,
  StackItem,
  Text
} from '@fluentui/react'
import { useBoolean } from '@fluentui/react-hooks'

import { ChatHistoryLoadingState, historyDeleteAll } from '../../api'
import { AppStateContext } from '../../state/AppProvider'

import ChatHistoryList from './ChatHistoryList'

import styles from './ChatHistoryPanel.module.css'

interface ChatHistoryPanelProps { }

export enum ChatHistoryPanelTabs {
  History = 'History'
}

const commandBarStyle: ICommandBarStyles = {
  root: {
    padding: '0',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  }
}

const commandBarButtonStyle: Partial<IStackStyles> = { root: { height: '50px' } }

export function ChatHistoryPanel(_props: ChatHistoryPanelProps) {
  const appStateContext = useContext(AppStateContext)
  const [showContextualMenu, setShowContextualMenu] = React.useState(false)
  const [hideClearAllDialog, { toggle: toggleClearAllDialog }] = useBoolean(true)
  const [clearing, setClearing] = React.useState(false)
  const [clearingError, setClearingError] = React.useState(false)

  const clearAllDialogContentProps = {
    type: DialogType.close,
    title: !clearingError ? '¿Estás seguro de que quieres borrar todo el historial de chat?' : 'Error al eliminar todo el historial de chat',
    closeButtonAriaLabel: 'Close',
    subText: !clearingError
      ? 'Todo el historial de chat se eliminará permanentemente.'
      : 'Por favor inténtalo de nuevo. Si el problema persiste, comuníquese con el administrador del sitio.'
  }

  const modalProps = {
    titleAriaId: 'labelId',
    subtitleAriaId: 'subTextId',
    isBlocking: true,
    styles: { main: { maxWidth: 450 } }
  }

  const menuItems: IContextualMenuItem[] = [
    { key: 'clearAll', text: 'Clear all chat history', iconProps: { iconName: 'Delete' } }
  ]

  const handleHistoryClick = () => {
    appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' })
  }

  const onShowContextualMenu = React.useCallback((ev: React.MouseEvent<HTMLElement>) => {
    ev.preventDefault() // don't navigate
    setShowContextualMenu(true)
  }, [])

  const onHideContextualMenu = React.useCallback(() => setShowContextualMenu(false), [])

  const onClearAllChatHistory = async () => {
    setClearing(true)
    const response = await historyDeleteAll()
    if (!response.ok) {
      setClearingError(true)
    } else {
      appStateContext?.dispatch({ type: 'DELETE_CHAT_HISTORY' })
      toggleClearAllDialog()
    }
    setClearing(false)
  }

  const onHideClearAllDialog = () => {
    toggleClearAllDialog()
    setTimeout(() => {
      setClearingError(false)
    }, 2000)
  }

  //Renders Chat History Panel and its items
  React.useEffect(() => { }, [appStateContext?.state.chatHistory, clearingError])

  return (
    <section className={styles.container} data-is-scrollable aria-label={'chat history panel'}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap aria-label="chat history header">
        <StackItem>
          <Text
            role="heading"
            aria-level={2}
            style={{
              alignSelf: 'center',
              fontWeight: '600',
              fontSize: '18px',
              marginRight: 'auto',
              paddingLeft: '20px',
              color: "black"
            }}>
            Historial
          </Text>
        </StackItem>
        <Stack verticalAlign="start">
          {/* Chat History Control buttons  */}
          <Stack horizontal styles={commandBarButtonStyle} >

            <CommandBarButton
              iconProps={{ iconName: 'More' }}
              title={'Borrar todo el historia'}
              onClick={onShowContextualMenu}
              aria-label={'clear all chat history'}
              styles={
                { root: { backgroundColor: "#cbe5ff" },
                  rootHovered: { backgroundColor: '#9ac4e3' },
                  rootPressed: { backgroundColor: "#cbe1ff" },
                  icon: { color: 'black' },
                  iconHovered: { color: 'black' },
                  iconPressed: { color: 'black' } }}
              role="button"
              id="moreButton"
            />

            {/* Items in the more options button (...) drop down */}
            <ContextualMenu
              items={menuItems}
              hidden={!showContextualMenu}
              target={'#moreButton'}
              onItemClick={toggleClearAllDialog}
              onDismiss={onHideContextualMenu}
              styles={{
                subComponentStyles: {
                  menuItem: {
                    root: {
                      backgroundColor: "#9ac4e3",
                      color: "black",
                      selectors: {
                        ":hover": {
                          backgroundColor: "#d6ecfb", color: "black",
                          ".ms-ContextualMenu-icon": {
                            color: "black",
                          },
                          ":active .ms-ContextualMenu-icon": {
                            color: "black",
                          }
                        },
                        ":active":{
                          backgroundColor: "#9ac4e3"
                        }
                      }
                    },
                    rootPressed: { backgroundColor: "##9ac4e3" },
                    icon: { color: "#000" },
                  }
                }
              }}
            />

            {/* X button */}
            <CommandBarButton
              iconProps={{ iconName: 'Cancel' }}
              title={'Esconder'}
              onClick={handleHistoryClick}
              aria-label={'hide button'}
              styles={{ root: { backgroundColor: "#cbe5ff" }, rootHovered: { backgroundColor: '#9ac4e3' }, rootPressed: { backgroundColor: "#9ac4e3" }, icon: { color: 'black' }, iconHovered: { color: 'black' }, iconPressed: { color: 'black' } }}
              role="button"
            />
          </Stack>
        </Stack>
      </Stack>
      <Stack
        aria-label="chat history panel content"
        styles={{
          root: {
            display: 'flex',
            flexGrow: 1,
            flexDirection: 'column',
            paddingTop: '2.5px',
            maxWidth: '100%'
          }
        }}
        style={{
          display: 'flex',
          flexGrow: 1,
          flexDirection: 'column',
          flexWrap: 'wrap',
          padding: '1px'
        }}>
        <Stack className={styles.chatHistoryListContainer}>
          {appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Success &&
            appStateContext?.state.isCosmosDBAvailable.cosmosDB && <ChatHistoryList />}
          {appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Fail &&
            appStateContext?.state.isCosmosDBAvailable && (
              <>
                <Stack>
                  <Stack horizontalAlign="center" verticalAlign="center" style={{ width: '100%', marginTop: 10 }}>
                    <StackItem>
                      <Text style={{ alignSelf: 'center', fontWeight: '400', fontSize: 16, color: 'white' }}>
                        {appStateContext?.state.isCosmosDBAvailable?.status && (
                          <span>{appStateContext?.state.isCosmosDBAvailable?.status}</span>
                        )}
                        {!appStateContext?.state.isCosmosDBAvailable?.status && <span>Error al cargar el historial de chat</span>}
                      </Text>
                    </StackItem>
                    <StackItem>
                      <Text style={{ alignSelf: 'center', fontWeight: '400', fontSize: 14, color: 'white' }}>
                        <span>El historial de chat no se puede guardar en este momento</span>
                      </Text>
                    </StackItem>
                  </Stack>
                </Stack>
              </>
            )}
          {appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Loading && (
            <>
              <Stack>
                <Stack
                  horizontal
                  horizontalAlign="center"
                  verticalAlign="center"
                  style={{ width: '100%', marginTop: 10 }}>
                  <StackItem style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Spinner
                      style={{ alignSelf: 'flex-start', height: '100%', marginRight: '5px' }}
                      size={SpinnerSize.medium}
                    />
                  </StackItem>
                  <StackItem>
                    <Text style={{ alignSelf: 'center', fontWeight: '400', fontSize: 14, color: 'white' }}>
                      <span style={{ whiteSpace: 'pre-wrap' }}>Cargando historial de chat</span>
                    </Text>
                  </StackItem>
                </Stack>
              </Stack>
            </>
          )}
        </Stack>
      </Stack>
      <Dialog
        hidden={hideClearAllDialog}
        onDismiss={clearing ? () => { } : onHideClearAllDialog}
        dialogContentProps={clearAllDialogContentProps}
        modalProps={modalProps}>
        <DialogFooter>
          {!clearingError && <PrimaryButton onClick={onClearAllChatHistory} disabled={clearing} text="Borrar todo" />}
          <DefaultButton
            onClick={onHideClearAllDialog}
            disabled={clearing}
            text={!clearingError ? 'Cancelar' : 'Cerrar'}
          />
        </DialogFooter>
      </Dialog>
    </section>
  )
}
