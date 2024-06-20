import React from 'react';
import { PrimaryButton } from '@fluentui/react';
import { Send24Filled, Send28Filled, Send32Filled } from '@fluentui/react-icons';
 
interface Props {
  onButtonClick?: () => void;
  disabled?: boolean;
}
 
const CustomPrimaryButton: React.FC<Props> = ({ onButtonClick, disabled }) => {
  return (
    <PrimaryButton
      onClick={onButtonClick}
      disabled={disabled}
      style={{
        backgroundColor: 'black',
        opacity:disabled?0.5:1,
 
      }}
      styles={{
        root: {
          color: "#FFFFFF",
          borderRadius: '100%', border: '1.5px solid black',
          padding:"21px",
          marginLeft:10,
          minWidth:0,
          height:"auto",
          '@media all and (max-width:575px)':{
            padding:'13px',
          },
 
            // '@media (max-width: 1000px) and (min-width: 500px)': {
            //   height: "80px",
            //   minWidth:"80px",
            //   marginLeft: 10,
            // },
            // '@media (max-width: 2500px) and (min-width: 1000px)': {
            //   height: "90px",
            //   minWidth:"90px",
            //   marginLeft: 20,
            // },
        },
        label: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        // root: {
        //   padding: '12px 20px',
        //   border: '1.5px solid black',
        //   borderRadius: 50,
        //   marginTop: 0,
        //   '@media (max-width: 1000px)': {
        //     height: "56px",
        //     width: "56px",
        //     minWidth: "56px",
        //   },
        //   '@media (max-width: 1000px) and (min-width: 500px)': {
        //     height: "80px",
        //     minWidth:"80px",
        //     marginLeft: 10,
        //   },
        //   '@media (max-width: 2500px) and (min-width: 1000px)': {
        //     height: "90px",
        //     minWidth:"90px",
        //     marginLeft: 20,
        //   },
        //   backgroundColor: disabled ? 'transparent' : 'black',
        // },
        rootHovered: {
          // backgroundColor: disabled ? 'transparent' : 'rgba(0, 0, 0, 0.8)',
          borderColor: 'black',
        },
        rootPressed: {
          // backgroundColor: disabled ? 'transparent' : 'rgba(0, 0, 0, 0.6)',
          borderColor: 'black',
        },
        rootDisabled: {
          // backgroundColor: 'transparent',
          borderColor: 'black',
        },
        textContainer: {
          color: disabled ? 'black' : 'white',
        },
        icon: {
          color: disabled ? 'black' : 'white',
        },
      }}
    ><Send28Filled color={'white'} /></PrimaryButton>
  );
};
 
export default CustomPrimaryButton;