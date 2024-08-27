import { CommandBarButton, DefaultButton, IButtonProps } from '@fluentui/react'

import styles from './Button.module.css'
import css from '../../components/common/Button.module.css'

interface ButtonProps extends IButtonProps {
  onClick: () => void
  text: string | undefined
  page?: string
}

export const ShareButton: React.FC<ButtonProps> = ({ onClick, text }) => {
  return (
    <CommandBarButton
      className={`${styles.shareButtonRoot} ${css.buttonStructure}`}
      iconProps={{ iconName: 'Share' }}
      onClick={onClick}
      text={text}
    />
  )
}

export const HistoryButton: React.FC<ButtonProps> = ({ onClick, text }) => {
  return (
    <DefaultButton
      className={`${styles.historyButtonRoot} ${css.buttonStructure}`}
      text={text}
      iconProps={{ iconName: 'History' }}
      onClick={onClick}
    />
  )
}


export const FaqButton: React.FC<ButtonProps> = ({ onClick, text }) => {
  return (
    <FaqButton
      className={`${styles.shareButtonRoot} ${css.buttonStructure}`}
      iconProps={{ iconName: 'Share' }}
      onClick={onClick}
      text={text}
    />
  )
}

// Test Joshua
export const PdfPageCitationButton: React.FC<ButtonProps> = ({onClick,text, page}) => {
  return (
    <PdfPageCitationButton
        onClick={onClick}
        text={text}
        page={page}
    />
  )

}
