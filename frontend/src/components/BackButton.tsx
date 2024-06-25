import React from 'react'
import { Icon, IIconProps } from '@fluentui/react'

interface BackButtonProps {
  onClick: () => void
}
const iconStyles: IIconProps = {
  iconName: 'Back',
  styles: {
    root: {
      marginRight: 20,
      marginTop: 4,
      fontWeight: 'bold',
      fontSize: '20px',
      color: '#FFFFFF',
      cursor: 'pointer',
      "@media (max-width: 767px)" : {
        fontSize: '16px',
      }
    }
  }
}
const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  return <Icon {...iconStyles} onClick={onClick} />
}

export default BackButton
