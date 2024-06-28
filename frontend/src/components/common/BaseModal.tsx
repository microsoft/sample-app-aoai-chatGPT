import { useEffect } from 'react'
import Modal from 'react-modal'

type Props = {
  isOpen: boolean
  style?: Modal.Styles
  className?: string
  onRequestClose?: any
  children: any
}

const modalOverlay = {
  overlay: {
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  }
}

const BaseModal = (props: Props) => {
  const { children, isOpen } = props

  const modalStyle = { ...props.style, ...modalOverlay }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'visible'
    }
  }, [isOpen])

  return isOpen ? (
    <Modal {...props} style={modalStyle}>
      {children}
    </Modal>
  ) : null
}

export default BaseModal
