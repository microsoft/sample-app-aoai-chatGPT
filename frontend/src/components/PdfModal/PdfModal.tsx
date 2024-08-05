import { FC } from 'react'
import BaseModal from '../common/BaseModal'
import { Styles } from 'react-modal'
import { FileEarmarkExcel, XLg } from 'react-bootstrap-icons'
import styles from './PdfModal.module.css'

interface PdfModalProps {
  isOpen: boolean
  closeModal: Function
  data: { name: string; url: string } | null
}

const modalStyle: Styles = {
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    maxWidth: '740px',
    //height:'630px',
    height: '700px',
    top: '50%',
    left: '50%',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '8px',
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  }
}

const PdfModal: FC<PdfModalProps> = ({ isOpen, closeModal, data }) => {
  return (
    <BaseModal isOpen={isOpen} style={modalStyle}>
      <div className={styles.header}>
        <span className={styles.title}>{data?.name || ' '}</span>{' '}
        <XLg onClick={() => closeModal()} className={styles.close} />
      </div>
      <div className={styles.body}>
        {data?.url ? (
          <iframe src={data?.url || ''} width="700" height="600" className={styles.pdf}></iframe>
          // width="700" height="500"
        ) : (
          <div className={styles.error}>
            <FileEarmarkExcel color="#334768" size={40} />
            <span className={styles.errorText}>There was a problem uploading the file</span>
          </div>
        )}
      </div>
    </BaseModal>
  )
}

export default PdfModal
