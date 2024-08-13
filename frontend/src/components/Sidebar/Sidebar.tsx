import { FC, useEffect, useState } from 'react'
import { Menu, MenuItem, Sidebar, menuClasses, sidebarClasses } from 'react-pro-sidebar'
import { ChevronDoubleLeft, ChevronDoubleRight, DatabaseSlash } from 'react-bootstrap-icons'
import { MoonLoader } from 'react-spinners'
import styles from '../Sidebar/Sidebar.module.css'
import { pdfList } from '../../api'
import PdfModal from '../PdfModal/PdfModal'

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
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false)
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; url: string } | null>(null)

  const togglePdfModal = () => {
    setShowPdfModal(!showPdfModal)
  }

  useEffect(() => {
    setLoading(true)
    const getPdfList = async () => {
      pdfList()
        .then(response => {
          setLoading(false)
          if (response !== null) {
            console.log(response);
            setPdfListJson(response)
          } else {
            setPdfListJson({})
          }
        })
        .catch(_err => {
          setLoading(false)
          console.error('There was an issue fetching your data.')
        })
    }
    getPdfList()
  }, [])

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
                    backgroundColor: 'rgb(202, 203, 219)',
                    '&::-webkit-scrollbar': {
                      display: 'none'
                    }
                  }
                }
              : {
                  ['.' + sidebarClasses.container]: {
                    backgroundColor: 'rgb(202, 203, 219)',
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
            {toggled ? (
              false
            ) : collapsed ? (
              <MenuItem
                icon={<ChevronDoubleRight color="#334768" size={20} />}
                onClick={handleCollapsedChange}
                rootStyles={{
                  ['.' + menuClasses.button]: {
                    color: '#fbfbfb',
                    '&:hover': {
                      backgroundColor: '#eecef9'
                    }
                  }
                }}></MenuItem>
            ) : (
              <MenuItem
                suffix={<ChevronDoubleLeft color="#334768" size={20} />}
                onClick={handleCollapsedChange}
                rootStyles={{
                  ['.' + menuClasses.button]: {
                    color: '#fbfbfb',
                    '&:hover': {
                      backgroundColor: '#eecef9'
                    }
                  }
                }}></MenuItem>
            )}
            {Object.keys(pdfListJson).length > 0 && loading === false
              ? Object.entries(pdfListJson).map(([key, value]) => (
                  <MenuItem
                    style={collapsed && !toggled ? { visibility: 'hidden' } : { color: '#201F1E' }}
                    rootStyles={{
                      ['.' + menuClasses.label]: {
                        whiteSpace: 'normal',
                        maxWidth: '100%',
                        wordWrap: 'break-word',
                        overflow: 'visible'
                      },
                      ['.' + menuClasses.button]: {
                        height: '100% !important',
                        paddingTop: '10px',
                        paddingBottom: '10px'
                      }
                    }}
                    onClick={() => {
                      setSelectedPdf({ name: key.toString(), url: value.toString() })
                      setShowPdfModal(true)
                    }}>
                    {key}
                  </MenuItem>
                ))
              : loading === false && (
                  <div
                    style={
                      collapsed && !toggled
                        ? { visibility: 'hidden' }
                        : { display: 'flex', alignItems: 'center', marginTop: '75%' }
                    }>
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
  )
}

export default SidebarMenu
