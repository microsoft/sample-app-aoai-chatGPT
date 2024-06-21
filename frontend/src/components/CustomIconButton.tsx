import React from 'react'
import { PrimaryButton } from '@fluentui/react'
import { Send24Filled, Send28Filled, Send32Filled } from '@fluentui/react-icons'

interface Props {
  onButtonClick?: () => void
  disabled?: boolean
}

const CustomPrimaryButton: React.FC<Props> = ({ onButtonClick, disabled }) => {
  return (
    <PrimaryButton
      onClick={onButtonClick}
      disabled={disabled}
      style={{
        backgroundColor: 'black',
        opacity: disabled ? 0.5 : 1
      }}
      styles={{
        root: {
          color: '#FFFFFF',
          borderRadius: '100%',
          border: '1.5px solid black',
          marginLeft: 10,
          height: '54px',
          width: '54px',
          minWidth: 'auto',
          '@media all and (max-width:575px)': {}
        },
        label: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        },
        rootHovered: {
          // backgroundColor: disabled ? 'transparent' : 'rgba(0, 0, 0, 0.8)',
          borderColor: 'black'
        },
        rootPressed: {
          // backgroundColor: disabled ? 'transparent' : 'rgba(0, 0, 0, 0.6)',
          borderColor: 'black'
        },
        rootDisabled: {
          // backgroundColor: 'transparent',
          borderColor: 'black'
        },
        textContainer: {
          color: disabled ? 'black' : 'white'
        },
        icon: {
          color: disabled ? 'black' : 'white'
        }
      }}>
      <Send28Filled color={'white'} />
    </PrimaryButton>
  )
}

export default CustomPrimaryButton
