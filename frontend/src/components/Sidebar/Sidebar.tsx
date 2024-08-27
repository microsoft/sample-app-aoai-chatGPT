import { FC, useEffect, useState, useContext} from 'react'
import { Menu, MenuItem, Sidebar, menuClasses, sidebarClasses } from 'react-pro-sidebar'
import { ChevronDoubleLeft, ChevronDoubleRight, DatabaseSlash } from 'react-bootstrap-icons'
import { MoonLoader } from 'react-spinners'
import styles from '../Sidebar/Sidebar.module.css'
import css from '../../components/common/Button.module.css'
import { pdfList } from '../../api'
import PdfModal from '../PdfModal/PdfModal'
import { IconButton, TooltipHost } from '@fluentui/react'

import uuid from 'react-uuid'
import { AppStateContext } from '../../state/AppProvider'

interface SidebarMenuProps {
  collapsed: boolean
  toggled: boolean
  handleToggleSidebar: (state: any) => void
  handleCollapsedChange: (state: any) => void
  children: React.ReactNode
}

const SidebarMenu: FC<SidebarMenuProps> = ({
  collapsed,
  toggled,
  handleToggleSidebar,
  handleCollapsedChange,
  children
}) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [pdfListJson, setPdfListJson] = useState<Object>({})
  const [filteredPdfList, setFilteredPdfList] = useState<Object>({});
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false)
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; url: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePdfKey, setActivePdfKey] = useState<string | null>(null)

  const togglePdfModal = () => {
    setShowPdfModal(!showPdfModal)
  }

  const appStateContext = useContext(AppStateContext);

  // Handle the case where the context might be undefined
  if (!appStateContext) {
    throw new Error('AppStateContext is not available. Ensure that your component is wrapped with the AppProvider.');
  }

  if (!appStateContext) {
    throw new Error('AppStateContext is not available. Ensure that the component is wrapped with the AppProvider.')
  }

  const handleButtonClick = (key: string) => {
    console.log(`Button clicked for initiating a new PDF chat (FilePath): ${key}`)
    const newConversationId = uuid() // Generate a new conversation ID
    console.log(`Generated new (conversation ID): ${newConversationId}`)

    appStateContext.dispatch({
      type: 'CREATE_NEW_PDF_CONVERSATION',
      payload: {
        id: newConversationId,
        pdfKey: key,
      },
    })

    setActivePdfKey(key)  // Set the clicked PDF as active

    const updatedState = appStateContext.state.chatHistory
    console.log('Updated chat history:', updatedState)
  }


  useEffect(() => {
    setLoading(true)
    const getPdfList = async () => {
      pdfList()
        .then(response => {
          setLoading(false)
          if (response !== null) {
            setPdfListJson(response)
            // test
            setFilteredPdfList(response)
          } else {
            setPdfListJson({})
            // test
            setFilteredPdfList({})
          }
        })
        .catch(_err => {
          setLoading(false)
          console.error('There was an issue fetching your data.')
        })
    }
    getPdfList()
  }, [])

  // Function Pdf Search
  useEffect(() => {
    const filteredList = Object.entries(pdfListJson).filter(([key]) =>
      key.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPdfList(Object.fromEntries(filteredList));
  }, [searchQuery, pdfListJson]);


  return (
    <>
      <div style={{ display: 'flex', height: '100vh', position: 'fixed', width: '100%' }}>
        <Sidebar
          className="app"
          onBackdropClick={() => handleToggleSidebar(false)}
          toggled={toggled}
          breakPoint="md"
          onBreakPoint={(broken: boolean) => (broken ? null : handleToggleSidebar(false))}
          collapsed={toggled ? false : collapsed}
          rootStyles={
            collapsed && !toggled
              ? {
                ['.' + sidebarClasses.container]: {
                  backgroundColor: '#cbe5ff',
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  }
                }
              }
              : {
                ['.' + sidebarClasses.container]: {
                  backgroundColor: '#cbe5ff',
                  '&::-webkit-scrollbar': {
                    width: '5px',
                    height: '5px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '3px'
                  },
                  '&::-webkit-scrollbar-track': {
                    height: '20px',
                    marginBlock: '-3px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#334768',
                    borderRadius: '3px'
                  }
                }
              }
          }>
          <Menu>
            {toggled ? null : (
              <>
                <MenuItem
                  icon={collapsed ? <ChevronDoubleRight color="#334768" size={20} /> : null}
                  onClick={handleCollapsedChange}
                  rootStyles={{
                    ['.' + menuClasses.button]: {
                      color: '#fbfbfb',
                      '&:hover': {
                        backgroundColor: '#eecef9',
                      },
                    },
                  }}
                >
                  {collapsed ? null : <ChevronDoubleLeft color="#334768" size={20} />}
                </MenuItem>
                {!collapsed && (
                  <div style={{ padding: '10px' }}>
                    <input
                      className={styles.searchbarPDF}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Busqueda de PDFs..."
                    />
                  </div>
                )}
              </>
            )}
            {Object.keys(filteredPdfList).length > 0 && loading === false
              ? Object.entries(filteredPdfList).map(([key, value]) => (
                <MenuItem
                  // style={collapsed && !toggled ? { visibility: 'hidden' } : { color: '#201F1E' }}
                  style={{
                    color: '#201F1E',
                    backgroundColor: activePdfKey === key ? '#cbe1ff' : 'transparent',  // Apply background color if selected
                    borderRadius: '5px',  // Optional: add some rounded corners
                  }}
                  rootStyles={{
                    ['.' + menuClasses.label]: {
                      whiteSpace: 'normal',
                      maxWidth: '100%',
                      wordWrap: 'break-word',
                      overflow: 'visible',
                    },
                    ['.' + menuClasses.button]: {
                      height: '100% !important',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                    },
                  }}
                  onClick={() => {
                    setSelectedPdf({ name: key.toString(), url: value.toString() })
                    setShowPdfModal(true)
                    setActivePdfKey(null)
                  }}
                  key={key} 
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <TooltipHost
                      content={key}
                      styles={{
                        root: {
                          display: 'inline-block',
                          maxWidth: 'calc(100% - 40px)', // Keep this consistent with the span
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }
                      }}
                    >
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'inline-block',
                          maxWidth: '100%',
                        }}
                      >
                        {key}
                      </span>
                    </TooltipHost>

                    {/* Button for chat per document */}
                    <IconButton
                      className={`${styles.itemChatButton} ${css.buttonStructure}`}
                      iconProps={{ iconName: 'CannedChat' }}
                      title="Canned Chat"
                      ariaLabel="Canned Chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleButtonClick(key);
                      }}
                    />
                  </div>
                </MenuItem>
              ))
              : loading === false && (
                <div
                  style={
                    collapsed && !toggled
                      ? { visibility: 'hidden' }
                      : { display: 'flex', alignItems: 'center', marginTop: '75%' }
                  }
                >
                  <DatabaseSlash color="#334768" size={35} style={{ marginLeft: '8px' }} />
                  <span style={{ fontSize: '24px', marginLeft: '5px' }}>No files available</span>
                </div>
              )}
            {loading && (
              <div className={styles.spinner}>
                <MoonLoader size={45} color="#334768" loading={loading} speedMultiplier={0.8} />
              </div>
            )}
          </Menu>
        </Sidebar>
        <main className={`col ${styles.conteiner}`}>{children}</main>
      </div>
      <PdfModal closeModal={togglePdfModal} isOpen={showPdfModal} data={selectedPdf} />
    </>
  );
};


export default SidebarMenu
