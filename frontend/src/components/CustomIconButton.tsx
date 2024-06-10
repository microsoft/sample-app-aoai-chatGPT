import React from 'react';
import { IconButton } from '@fluentui/react';
interface Props {
  onButtonClick?: () => void;
  disabled?: boolean
}
const CustomIconButton: React.FC<Props> = ({ onButtonClick, disabled }) => {


  return (
    <IconButton
      iconProps={{ iconName: 'Send',style: {color: disabled ? 'black' : 'white' } }}
      ariaLabel="Send"
      disabled={disabled}
      onClick={onButtonClick}
      style={{  background: disabled ? "transparent" : "black", marginLeft:5,padding: 28, border: disabled ? "1px solid black" : "none", borderRadius: 50, marginTop: 0 }}
    />
  );
};

export default CustomIconButton;
