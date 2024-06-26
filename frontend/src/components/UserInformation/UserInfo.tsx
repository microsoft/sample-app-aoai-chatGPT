import * as React from 'react';
import { Stack, TextField, IconButton, PrimaryButton, ComboBox, IComboBoxOption, IComboBox } from '@fluentui/react';
import uuid from 'react-uuid';
import style from "../../pages/layout/Layout.module.css"
import { Send24Filled, Send28Filled } from '@fluentui/react-icons';
import { useEffect, useState } from 'react';
import { getCities, getStates } from '../../api';

const UserInfo: React.FC = () => {
  const [states, setStates] = useState<IComboBoxOption[]>([]);
  const [cities, setCities] = useState<IComboBoxOption[]>([]);
  const [selectedState, setSelectedState] = useState<string | undefined>();

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

  const comboBoxStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'inherit',
  };

  const [inputValue, setInputValue] = React.useState<string>('');

  const handleChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setInputValue(newValue || "")
  }

  const handleSave = () => {
    const dataToSave = { name: inputValue, id: uuid() };
    localStorage.setItem('userInfo', JSON.stringify([dataToSave]));
    window.location.reload();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      handleSave?.();
    }
  };

  useEffect(() => {
    // Fetch states from the backend
    const fetchStates = async () => {
      var fetchedStates = await getStates();
      setStates(fetchedStates.map((state: string) => ({ key: state, text: state })));
    };

    fetchStates();
  }, []);

  const handleStateChange = async (event: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
    if (option) {
      setSelectedState(option.key as string);
      // Fetch cities based on the selected state
      const cities = await getCities(option.key);
      setCities(cities.map((city: string) => ({ key: city, text: city })));
    }
  };

  return (
    <Stack horizontalAlign='center'
      tokens={{ childrenGap: 20 }}
      styles={{
        root: {
          width: "100%",
          margin: 'auto',
          height: "calc(100vh - 100px)",
          '@media (max-width: 600px)': {
            height: "calc(100vh - 70px)",
          },
          justifyContent: 'center'
        }
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          width: "100%",
          padding: "0px 20px"
        }}>
        {/* <div className={style.comboBoxField}>
          <div className={style.comboBoxWrapper}>
            <ComboBox
              selectedKey={selectedState}
              options={states}
              onChange={handleStateChange}
              style={comboBoxStyle}
              placeholder='Enter your State'
            />
          </div>
        </div>
        <div className={style.comboBoxField}>
          <div className={style.comboBoxWrapper}>
            <ComboBox
              options={cities}
              disabled={!selectedState}
              style={comboBoxStyle}
              placeholder='Enter your City'
            />
          </div>
        </div> */}
        <div className={style.userinputField}>
          <div style={textFieldWrapperStyle}>
            <TextField
              placeholder={"Enter your city name"}
              borderless
              value={inputValue}
              styles={{
                root: {
                  color: "#FFFFFF",
                  overflow: 'hidden',
                },
                fieldGroup: {
                  borderRadius: '25px',
                  backgroundColor: 'inherit',
                  margin: "-2px",
                  overflow: 'hidden',
                  border: 'none',
                },
                field: {
                  backgroundColor: 'inherit',
                  overflow: 'hidden',
                  color: "#FFFFFF",
                  '@media (max-width: 1000px)': {
                    fontSize: "14px"
                  },
                  '@media (max-width: 2500px) and (min-width: 1000px)': {
                    fontSize: "24px"
                  },
                  '::placeholder': {
                    color: '#7c909b',
                  },
                },
              }}
              style={textFieldStyle}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>
          <PrimaryButton
            onClick={handleSave}
            styles={{
              root: {
                backgroundColor: 'transparent',
                color: "#FFFFFF",
                borderRadius: 10, border: "none",
                minWidth:0,
                padding:"0px 5px",
                selectors: {
                  ':hover': {
                    background: 'transparent !important',
                    border:"none !important",
                    borderColor:"transparent !important"
                  },
                  ':active': {
                    background: '#202a2f',
                    border:"none !important"
                  },
                  ':focus': {
                    background: 'transparent',
                    border:"none !important"
                  }
                }
              }
              
            }}
          >
            <Send28Filled />
          </PrimaryButton>

        </div>
      </div>
    </Stack>
  );
};

export default UserInfo;