import React, { useContext, useState } from 'react';
import { TextField, PrimaryButton } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '../state/AppProvider';
import { getRecommendations } from '../api';

interface Props {
  placeholder: string,
  onButtonClick?: () => void;
  text: string,
  setText?: (value: string) => void;
  allowBorder?: boolean,
  isButtonRequired?: boolean
  onFocus?: () => void;
  onBlur?: () => void;
  isTextFieldFocused?: boolean
}

const CustomTextField: React.FC<Props> = ({ placeholder, onButtonClick, text, setText, allowBorder = false, isButtonRequired = true, onFocus, onBlur, isTextFieldFocused = false }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: '35px',
    backgroundColor: isTextFieldFocused ? "#313F46" : "#313F46",
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
    borderRadius: '25px',
  };
  const appStateContext = useContext(AppStateContext)

  const [isButtonClicked, setIsButtonClicked] = useState(false);

  const handleChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setInputText(newValue || '');
  };
const [inputText,setInputText]=useState<string>("");
  const navigate = useNavigate();

  const handleNavigate = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setIsButtonClicked(true);
    try {
      appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: true })
      const response = getRecommendations({ question: text+` ${inputText}` })
      const data = {
        "output": "{\"value_propositions\": [{\"title\": \"REGENCY 250 LE3 Sport\", \"detail\": \"Offers a luxurious and comfortable experience for a crew of 14, perfect for watersports with its 350-horsepower rating and ski tow pylon.\"}, {\"title\": \"TAHOE 2150\", \"detail\": \"Combines spacious luxury with sporting capability, also featuring the POWERGLIDE\® hull and ski tow pylon, ideal for families enjoying watersports.\"}, {\"title\": \"Sun Tracker Sportfish\", \"detail\": \"A versatile option that combines a fishing boat's utility with the comfort of a party barge, perfect for Lake George outings.\"}]}"
      }

      const parsedData = JSON.parse(data?.output);
      const actuallRecommendations = parsedData?.value_propositions
      appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_STATE', payload: actuallRecommendations })
      appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: false })
      navigate("recommendations");

    } catch (error) {
      appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: false })
    }
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
    <div style={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%" }}>
      <div style={containerStyle}>
        <div style={textFieldWrapperStyle}>
          <TextField
            placeholder={placeholder}
            borderless
            value={inputText}
            resizable={false}
            multiline
            rows={isTextFieldFocused ? 4 : 1}
            styles={{
              root: {
                color: "#FFFFFF",
                height: isTextFieldFocused ? "150px" : "30px",
                textOverflow: !isTextFieldFocused ? 'ellipsis' : 'initial',
                overflow: 'hidden',
              },
              fieldGroup: {
                borderRadius: '25px',
                backgroundColor: 'inherit',
                margin: "-2px",
                height: isTextFieldFocused ? "150px" : "30px",
                textOverflow: !isTextFieldFocused ? 'ellipsis' : 'initial',
                overflow: 'hidden',
                lineHeight: isTextFieldFocused ? "1.6em" : "1,5em",
                border: 'none',
              },
              field: {
                backgroundColor: 'inherit',
                height: isTextFieldFocused ? "150px" : "30px",
                textOverflow: !isTextFieldFocused ? 'ellipsis' : 'initial',
                overflow: 'hidden',
                lineHeight: isTextFieldFocused ? "1.6em" : "1.5em",
                color: "#FFFFFF",
                '::placeholder': {
                  color: '#7c909b',
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
          style={{
            width: "100%",
            marginTop: 20,
            height: "50px",
            borderRadius: 10,
            padding: 20,
            fontSize: "0.875rem",
            background: "black",
            border: "none"
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleNavigate}
        >
          Submit
        </PrimaryButton>
      )}
    </div>
  );
};

export default CustomTextField;
