import { FC } from 'react'
import { Menu, MenuItem, Sidebar, menuClasses } from 'react-pro-sidebar'
import { ChevronDoubleLeft, ChevronDoubleRight } from 'react-bootstrap-icons'
import styles from '../Sidebar/Sidebar.module.css'

interface SidebarMenuProps {
  collapsed: boolean
  toggled: boolean
  handleToggleSidebar: any
  handleCollapsedChange: any
  children: React.ReactNode
}

const SidebarMenu: FC<SidebarMenuProps> = ({
  collapsed,
  toggled,
  handleToggleSidebar,
  handleCollapsedChange,
  children
}) => {
  return (
    <div style={{ display: 'flex', height: '100vh', position: 'fixed', width: '100%' }}>
      <Sidebar
        className="app"
        onBackdropClick={() => handleToggleSidebar(false)}
        toggled={toggled}
        breakPoint="md"
        collapsed={toggled ? false : collapsed}>
        <Menu>
          {toggled ? (
            false
          ) : collapsed ? (
            <MenuItem
              icon={<ChevronDoubleRight />}
              onClick={handleCollapsedChange}
              rootStyles={{
                ['.' + menuClasses.button]: {
                  backgroundColor: '#fbfbfb',
                  color: '#fbfbfb',
                  '&:hover': {
                    backgroundColor: '#eecef9'
                  }
                }
              }}></MenuItem>
          ) : (
            <MenuItem
              suffix={<ChevronDoubleLeft />}
              onClick={handleCollapsedChange}
              rootStyles={{
                ['.' + menuClasses.button]: {
                  backgroundColor: '#fbfbfb',
                  color: '#fbfbfb',
                  '&:hover': {
                    backgroundColor: '#eecef9'
                  }
                }
              }}></MenuItem>
          )}
          <MenuItem> Item 1</MenuItem>
          <MenuItem> Item 2</MenuItem>
          <MenuItem> Item 3</MenuItem>
        </Menu>
      </Sidebar>
      <main className={`col ${styles.conteiner}`}>{children}</main>
    </div>
  )
}

export default SidebarMenu
