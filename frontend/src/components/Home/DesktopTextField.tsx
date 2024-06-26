import React, { useContext, useState } from 'react';
import { TextField, PrimaryButton, FontSizes, DefaultButton } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import style from "./Home.module.css"
import { AppStateContext } from '../../state/AppProvider';
import { Send16Filled, Send24Filled, Send28Filled } from '@fluentui/react-icons';
 
interface Props {
  placeholder: string,
  onButtonClick?: () => void;
  promptValue:string,
  text: string,
  setText?: (value: string) => void;
  allowBorder?: boolean,
  isButtonRequired?: boolean
  onFocus?: () => void;
  onBlur?: () => void;
  isTextFieldFocused?: boolean;
  isButtonEnabled?:boolean
}
 
const DesktopTextField: React.FC<Props> = ({ placeholder, onButtonClick, text,setText, promptValue,allowBorder = false, isButtonRequired = true, onFocus, onBlur, isTextFieldFocused = false,isButtonEnabled=false }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: '5px',
    backgroundColor: "#313F46",
    padding: '15px',
    boxShadow: 'none',
    border: allowBorder ? "2px solid #378588" : "none"
  };
 
  const textFieldStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'inherit',
  };
 
  const textFieldWrapperStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: '5px',
    height: "100%",
    padding:"10px 10px"
  };
  const appStateContext = useContext(AppStateContext)
 
  const [isButtonClicked, setIsButtonClicked] = useState(false);
 
  const handleChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setInputText(newValue || '');
    setText?.(newValue || '');
  };
  const [inputText, setInputText] = useState<string>("");
  const navigate = useNavigate();
 
  const handleNavigate = (event: React.MouseEvent<HTMLButtonElement>) => {
 console.log({isButtonEnabled,inputText,promptValue})
 
    event.stopPropagation();
    event.preventDefault();
    setIsButtonClicked(true);
    const inputPayload = promptValue + ` ${text}`;
    appStateContext?.dispatch({ type: 'SET_PROMPT_VALUE', payload: inputPayload })
    navigate("recommendations");
    setIsButtonClicked(false);
  };
 
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      onButtonClick?.();
    }
  };
 
  const handleBlur = () => {
    if (!isButtonClicked) {
      onBlur?.();
    }
  };
 
  const handleMouseDown = () => {
    setIsButtonClicked(true);
  };
 
  const handleMouseUp = () => {
    setTimeout(() => {
      setIsButtonClicked(false);
    }, 0);
  };
 
  return (
    <div className={style.inputFieldContainer}>
      <div className={style.mainInputField}>
        <div style={textFieldWrapperStyle}>
          <TextField
            placeholder={placeholder}
            borderless
            value={text}
            resizable={false}
            multiline
            rows={14}
            styles={{
              root: {
                color: "#000000",
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              },
              fieldGroup: {
                borderRadius: '10px',
                backgroundColor: 'inherit',
                minHeight:'auto',
                textOverflow: 'ellipsis',
 
                overflow: 'hidden',
                lineHeight: "1,5em",
                border: 'none',
              },
              field: {
                backgroundColor: 'inherit',
                textOverflow: 'ellipsis',
 
                fontSize:"16px",
                fontWeight: 300,
                overflow: 'hidden',
                lineHeight: "1.2em",
                color:"#ffffff",
                '::placeholder': {
                  color:"#8fa5b0",
                    fontWeight: "300",
                    fontSize:"16px",
                },
              },
            }}
            style={textFieldStyle}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>
      {isButtonRequired && (
        <PrimaryButton
        disabled={!isButtonEnabled && inputText==="" && promptValue===""}
          styles={
            {
              label:{
                color:"#515F67",
                fontWeight:500,
                fontSize:"20px",
 
                '@media (max-width: 2500px) and (min-width: 1300px)': {
                },
              }
            }
          }
          style={{
            width: "100%",
            // marginTop: 20,
            borderRadius: 10,
            padding: 22,
            fontSize: "0.875rem",
            background:isButtonEnabled || inputText!=="" || promptValue!=="" ? "#151B1E": "#151B1E",
            border: "none",
            boxShadow:"none"
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleNavigate}
        >
          <div style={{display:'flex',alignItems:'center',justifyContent:"center"}}>
            <span style={{color:(!isButtonEnabled && inputText==="" && promptValue==="") ? '#515F67' :"#FFFFFF",fontSize:"16px",fontWeight:"600",lineHeight:"2rem"}}>
          Let's Go
          </span>
          <Send16Filled color={(!isButtonEnabled && inputText==="" && promptValue==="") ? '#515F67' :"#FFFFFF"} height={"12px"} width={"!2px"} style={{marginLeft:10}} />
          </div>
        </PrimaryButton>
      )}
      </div>
  );
};
 
export default DesktopTextField;