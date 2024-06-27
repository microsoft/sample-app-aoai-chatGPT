import React from 'react'
import { DefaultButton, Icon, IIconProps } from '@fluentui/react'
import style from "./ProductInformation/ProductInfo.module.css"
interface BackButtonProps {
  onClick: () => void
}
const iconStyles: IIconProps = {
  iconName: 'Back',
  styles: {
    root: {
      padding:"8px 36px",
      background: "#2f3a40",
      marginTop: 4,
      marginRight: 40,
      borderRadius:"50px",
      fontWeight: 'bold',
      fontSize: '16px',
      color: '#FFFFFF',
      cursor: 'pointer',
      "@media (max-width: 767px)" : {
        fontSize: '16px',
        marginRight: 20,
      }
    }
  }
}
const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  return <Icon className={style.backButton} {...iconStyles} onClick={onClick} />
}

export default BackButton
