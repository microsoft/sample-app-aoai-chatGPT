import * as React from 'react'
import { useContext, useEffect, useRef, useState } from 'react'
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  IconButton,
  ITextField,
  List,
  PrimaryButton,
  Separator,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
  TextField
} from '@fluentui/react'
import { useBoolean } from '@fluentui/react-hooks'

import { historyDelete, historyList, historyRename } from '../../api'
import { Conversation } from '../../api/models'
import { AppStateContext } from '../../state/AppProvider'

import { GroupedChatHistory } from './ChatHistoryList'

import styles from './ChatHistoryPanel.module.css'
import css from '../../components/common/Button.module.css'

interface ChatHistoryListItemCellProps {
  item?: Conversation
  onSelect: (item: Conversation | null) => void
}

interface ChatHistoryListItemGroupsProps {
  groupedChatHistory: GroupedChatHistory[]
}

const formatMonth = (month: string) => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  const [monthName, yearString] = month.split(' ')
  const year = parseInt(yearString)

  if (year === currentYear) {
    return monthName
  } else {
    return month
  }
}

export const ChatHistoryListItemCell: React.FC<ChatHistoryListItemCellProps> = ({ item, onSelect }) => {
  const [isHovered, setIsHovered] = React.useState(false)
  const [edit, setEdit] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [hideDeleteDialog, { toggle: toggleDeleteDialog }] = useBoolean(true)
  const [errorDelete, setErrorDelete] = useState(false)
  const [renameLoading, setRenameLoading] = useState(false)
  const [errorRename, setErrorRename] = useState<string | undefined>(undefined)
  const [textFieldFocused, setTextFieldFocused] = useState(false)
  const textFieldRef = useRef<ITextField | null>(null)

  const appStateContext = React.useContext(AppStateContext)
  const isSelected = item?.id === appStateContext?.state.currentChat?.id
  const dialogContentProps = {
    type: DialogType.close,
    title: '¿Estás seguro de que quieres borrar todo el historial de chat?',
    closeButtonAriaLabel: 'Close',
    subText: 'Todo el historial de chat se eliminará permanentemente.'
  }

  const modalProps = {
    titleAriaId: 'labelId',
    subtitleAriaId: 'subTextId',
    isBlocking: true,
    styles: { main: { maxWidth: 450 } }
  }

  if (!item) {
    return null
  }

  useEffect(() => {
    if (textFieldFocused && textFieldRef.current) {
      textFieldRef.current.focus()
      setTextFieldFocused(false)
    }
  }, [textFieldFocused])

  useEffect(() => {
    if (appStateContext?.state.currentChat?.id !== item?.id) {
      setEdit(false)
      setEditTitle('')
    }
  }, [appStateContext?.state.currentChat?.id, item?.id])

  const onDelete = async () => {
    const response = await historyDelete(item.id)
    if (!response.ok) {
      setErrorDelete(true)
      setTimeout(() => {
        setErrorDelete(false)
      }, 5000)
    } else {
      appStateContext?.dispatch({ type: 'DELETE_CHAT_ENTRY', payload: item.id })
    }
    toggleDeleteDialog()
  }

  const onEdit = () => {
    setEdit(true)
    setTextFieldFocused(true)
    setEditTitle(item?.title)
  }

  const handleSelectItem = () => {
    onSelect(item)
    appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: item })
  }

  const truncatedTitle = item?.title?.length > 28 ? `${item.title.substring(0, 28)} ...` : item.title

  const handleSaveEdit = async (e: any) => {
    e.preventDefault()
    if (errorRename || renameLoading) {
      return
    }
    if (editTitle == item.title) {
      setErrorRename('Error: ingrese un nuevo título para continuar.')
      setTimeout(() => {
        setErrorRename(undefined)
        setTextFieldFocused(true)
        if (textFieldRef.current) {
          textFieldRef.current.focus()
        }
      }, 5000)
      return
    }
    setRenameLoading(true)
    const response = await historyRename(item.id, editTitle)
    if (!response.ok) {
      setErrorRename('Error: no se pudo cambiar el nombre del elemento')
      setTimeout(() => {
        setTextFieldFocused(true)
        setErrorRename(undefined)
        if (textFieldRef.current) {
          textFieldRef.current.focus()
        }
      }, 5000)
    } else {
      setRenameLoading(false)
      setEdit(false)
      appStateContext?.dispatch({ type: 'UPDATE_CHAT_TITLE', payload: { ...item, title: editTitle } as Conversation })
      setEditTitle('')
    }
  }

  const chatHistoryTitleOnChange = (e: any) => {
    setEditTitle(e.target.value)
  }

  const cancelEditTitle = () => {
    setEdit(false)
    setEditTitle('')
  }

  const handleKeyPressEdit = (e: any) => {
    if (e.key === 'Enter') {
      return handleSaveEdit(e)
    }
    if (e.key === 'Escape') {
      cancelEditTitle()
      return
    }
  }

  return (
    <Stack
      key={item.id}
      tabIndex={0}
      aria-label="chat history item"
      className={styles.itemCell}
      onClick={() => handleSelectItem()}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ' ? handleSelectItem() : null)}
      verticalAlign="center"
      // horizontal
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      styles={{
        root: {
          backgroundColor: isSelected ? '#9ac4e3' : 'transparent'
        }
      }}>
      {edit ? (
        <>
          <Stack.Item style={{ width: '100%' }}>
            <form aria-label="edit title form" onSubmit={e => handleSaveEdit(e)} style={{ padding: '5px 0px' }}>
              <Stack horizontal verticalAlign={'center'}>
                <Stack.Item>
                <TextField
    componentRef={textFieldRef}
    autoFocus={textFieldFocused}
    value={editTitle}
    placeholder={item.title}
    onChange={chatHistoryTitleOnChange}
    onKeyDown={handleKeyPressEdit}
    disabled={errorRename ? true : false}
    styles={{
      root: {
        selectors: {
          ".ms-TextField-fieldGroup": {
            border: '1px solid transparent !important',
            borderRadius: '10px !important',
            height: '2.3rem',
          },
          ".ms-TextField-field": {
            paddingLeft: '10px',
            color: 'black',
          },
        },
      },
    }}
/>
                </Stack.Item>
                {editTitle && (
                  <Stack.Item>
                    <Stack aria-label="action button group" horizontal verticalAlign={'center'}>
                      <IconButton
                        role="button"
                        disabled={errorRename !== undefined}
                        onKeyDown={e => (e.key === ' ' || e.key === 'Enter' ? handleSaveEdit(e) : null)}
                        onClick={e => handleSaveEdit(e)}
                        aria-label="confirm new title"
                        iconProps={{ iconName: 'CheckMark' }}
                        styles={{ root: { color: 'green', marginLeft: '5px' }, rootHovered: { color: 'green', marginLeft: '5px', background: '#cbe5ff' } }}
                      />
                      <IconButton
                        role="button"
                        disabled={errorRename !== undefined}
                        onKeyDown={e => (e.key === ' ' || e.key === 'Enter' ? cancelEditTitle() : null)}
                        onClick={() => cancelEditTitle()}
                        aria-label="cancel edit title"
                        iconProps={{ iconName: 'Cancel' }}
                        styles={{ root: { color: 'red', marginLeft: '5px' }, rootHovered: { color: 'red', marginLeft: '5px', background: '#cbe5ff' } }}
                      />
                    </Stack>
                  </Stack.Item>
                )}
              </Stack>
              {errorRename && (
                <Text
                  role="alert"
                  aria-label={errorRename}
                  style={{ fontSize: 12, fontWeight: 400, color: 'rgb(164,38,44)' }}>
                  {errorRename}
                </Text>
              )}
            </form>
          </Stack.Item>
        </>
      ) : (
        // Delete and Edit buttons in Chat History Panel
        <>
          <Stack horizontal verticalAlign={'center'} style={{ width: '100%' }}>
            <div className={styles.chatTitle}>{truncatedTitle}</div>
            {(isSelected || isHovered) && (
              <Stack horizontal horizontalAlign="end">
                <IconButton
                  className={`${styles.itemButton} ${css.buttonStructure}`}
                  iconProps={{ iconName: 'Delete' }}
                  title="Borrar"
                  onClick={toggleDeleteDialog}
                  onKeyDown={e => (e.key === ' ' ? toggleDeleteDialog() : null)}
                />
                <IconButton
                  className={`${styles.itemButton} ${css.buttonStructure}`}
                  iconProps={{ iconName: 'Edit' }}
                  title="Editar"
                  onClick={onEdit}
                  onKeyDown={e => (e.key === ' ' ? onEdit() : null)}
                />
              </Stack>
            )}
          </Stack>
        </>
      )}
      {errorDelete && (
        <Text
          styles={{
            root: { color: 'red', marginTop: 5, fontSize: 14 }
          }}>
          Error: no se pudo eliminar el elemento
        </Text>
      )}
      <Dialog
        hidden={hideDeleteDialog}
        onDismiss={toggleDeleteDialog}
        dialogContentProps={dialogContentProps}
        modalProps={modalProps}>
        <DialogFooter>
          <PrimaryButton onClick={onDelete} text="Borrar" className={`${css.deletePanelButtonsGeneral} ${css.deletePanelButton}`} />
          <DefaultButton onClick={toggleDeleteDialog} text="Cancelar" className={css.deletePanelButtonsGeneral} />
        </DialogFooter>
      </Dialog>
    </Stack>
  )
}

export const ChatHistoryListItemGroups: React.FC<ChatHistoryListItemGroupsProps> = ({ groupedChatHistory }) => {
  const appStateContext = useContext(AppStateContext)
  const observerTarget = useRef(null)
  const [, setSelectedItem] = React.useState<Conversation | null>(null)
  const [offset, setOffset] = useState<number>(25)
  const [observerCounter, setObserverCounter] = useState(0)
  const [showSpinner, setShowSpinner] = useState(false)
  const firstRender = useRef(true)

  const handleSelectHistory = (item?: Conversation) => {
    if (item) {
      setSelectedItem(item)
    }
  }

  const onRenderCell = (item?: Conversation) => {
    return <ChatHistoryListItemCell item={item} onSelect={() => handleSelectHistory(item)} />
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    handleFetchHistory()
    setOffset(offset => (offset += 25))
  }, [observerCounter])

  const handleFetchHistory = async () => {
    const currentChatHistory = appStateContext?.state.chatHistory
    setShowSpinner(true)

    await historyList(offset).then(response => {
      const concatenatedChatHistory = currentChatHistory && response && currentChatHistory.concat(...response)
      if (response) {
        appStateContext?.dispatch({ type: 'FETCH_CHAT_HISTORY', payload: concatenatedChatHistory || response })
      } else {
        appStateContext?.dispatch({ type: 'FETCH_CHAT_HISTORY', payload: null })
      }
      setShowSpinner(false)
      return response
    })
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) setObserverCounter(observerCounter => (observerCounter += 1))
      },
      { threshold: 1 }
    )

    if (observerTarget.current) observer.observe(observerTarget.current)

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current)
    }
  }, [observerTarget])

  return (
    <div className={styles.listContainer} data-is-scrollable>
      {groupedChatHistory.map(
        group =>
          group.entries.length > 0 && (
            <Stack
              horizontalAlign="start"
              verticalAlign="center"
              key={group.month}
              className={styles.chatGroup}
              aria-label={`chat history group: ${group.month}`}>
              <Stack aria-label={group.month} className={styles.chatMonth}>
                {formatMonth(group.month)}
              </Stack>
              <List
                aria-label={`chat history list`}
                items={group.entries}
                onRenderCell={onRenderCell}
                className={styles.chatList}
              />
              <div ref={observerTarget} />
              <Separator
                styles={{
                  root: {
                    width: '100%',
                    position: 'relative',
                    '::before': {
                      backgroundColor: '#664c96'
                    }
                  }
                }}
              />
            </Stack>
          )
      )}
      {showSpinner && (
        <div className={styles.spinnerContainer}>
          <Spinner size={SpinnerSize.small} aria-label="loading more chat history" className={styles.spinner} />
        </div>
      )}
    </div>
  )
}
