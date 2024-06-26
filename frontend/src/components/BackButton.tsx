import React from 'react'
import { Icon, IIconProps } from '@fluentui/react'

interface BackButtonProps {
  onClick: () => void
}
const iconStyles: IIconProps = {
  iconName: 'Back',
  styles: {
    root: {
      padding:"7px 12px",
      background:"#2F3A40",
      marginTop: 4,
      marginRight: 40,
      borderRadius:"4px",
      fontWeight: 'bold',
      fontSize: '20px',
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
  return <Icon {...iconStyles} onClick={onClick} />
}

export default BackButton
