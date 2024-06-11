import React, { useContext, useEffect, useState } from 'react';
import { PrimaryButton, Stack, Text } from '@fluentui/react';
import WalkAround from './WalkAround';
import FlashCard from './FlashCard';
import styles from '../../pages/chat/Chat.module.css'
import { useNavigate } from 'react-router-dom';
import { Library16Filled, VehicleShip16Filled } from '@fluentui/react-icons';
import { AppStateContext } from '../../state/AppProvider';
import { templete2, templete3 } from '../../constants/templete';
import { getValuePropositions, getWalkthroughData } from '../../api';

const ProductInformation: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('FlashCard');
  const navigate = useNavigate();
  const appStateContext = useContext(AppStateContext);
  const selectedboat = appStateContext?.state?.selectedBoat;
  const conversationId = appStateContext?.state?.conversationId;

  const fetch = async () => {
    try {
      appStateContext?.dispatch({ type: 'SET_VALUE_PROPOSITION_LOADING', payload: true })
      appStateContext?.dispatch({ type: 'SET_WALKTHROUGH_LOADING', payload: true })

      const valuePropositionsResponse = await getValuePropositions(templete2(selectedboat || ""),conversationId || "")
      // const valuePropositionsData =
      // {
      //   "output": "{\"value_propositions\": [{\"title\": \"TRACK FORMED fence design with high-sheen finish\", \"detail\": \"Delivers enhanced aesthetic appeal and durability\"}, {\"title\": \"10\’ SUN TRACKER QuickLift Bimini top\", \"detail\": \"Provides easy and quick protection from the sun\"}, {\"title\": \"SUN TRACKER FLARE touchscreen gauge display & 12-button switch panel\", \"detail\": \"Offers modern, easy-to-use navigational and control features\"}, {\"title\": \"Wet Sounds stereo with Bluetooth & two 6.5\\\" upholstery speakers\", \"detail\": \"Ensures high-quality audio entertainment on the water\"}, {\"title\": \"New motor & adaptor harnesses\", \"detail\": \"Improves performance and compatibility with various accessories\"}]}"
      // }
      // const walkaroundData =
      // {
      //   "output": "{\"value_propositions\": [{\"title\": \"Driver Console\", \"detail\": \"Features an advanced 8\” TAHOE CRUISE\® digital touchscreen dashboard for unprecedented insight and control, paired with a sport steering wheel and responsive hydraulic steering.\"}, {\"title\": \"Seating Capacity\", \"detail\": \"Accommodates up to 11 passengers in a feature-rich interior, ensuring comfort during full days of cruising and adventure.\"}, {\"title\": \"Entertainment System\", \"detail\": \"Equipped with a powerful KICKER\® Bluetooth stereo system and an advanced phone management station for all-day entertainment.\"}, {\"title\": \"Storage Solutions\", \"detail\": \"Plentiful storage options are available for all your gear, keeping the deck clear and organized.\"}, {\"title\": \"Water Sports Features\", \"detail\": \"Comes with a removable ski tow pylon for water sports and adventure.\"}, {\"title\": \"Swim Platforms\", \"detail\": \"Features aft swim platforms with a boarding ladder, making it easy to access the water.\"}]}"
      // }

      if (valuePropositionsResponse) {
        const parsedDataValueProps = JSON.parse(valuePropositionsResponse?.messages);
        const valuePropositions = parsedDataValueProps?.result
        appStateContext?.dispatch({ type: 'SET_VALUE_PROPOSITION_STATE', payload: valuePropositions })
      }
      const walkaroundResponse = await getWalkthroughData(templete3(selectedboat || ""),conversationId || "")

      if (walkaroundResponse) {
        const parsedDataWalkThrough = JSON.parse(walkaroundResponse?.messages);
        const walkThrough = parsedDataWalkThrough?.result
        appStateContext?.dispatch({ type: 'SET_WALKTHROUGH_STATE', payload: walkThrough })
      }

    } catch (error) {
      appStateContext?.dispatch({ type: 'SET_VALUE_PROPOSITION_LOADING', payload: false })
      appStateContext?.dispatch({ type: 'SET_WALKTHROUGH_LOADING', payload: false })
    }
  }

  useEffect(() => {
    fetch();
  }, [])

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
  };

  const handleNextClick = () => {
    navigate("/feedback");
  };

  return (
    <div className={styles.chatContainer}>
      <Stack horizontalAlign="center" 
        styles={{
          root: {
            height: '100vh', padding: 20, marginTop: 50,
            '@media (max-width: 1000px)': {
              width: "100%",
            },
            '@media (max-width: 2500px) and (min-width: 1000px)': {
              width: "50%",
            },
       } }}>
        <Stack horizontal tokens={{ childrenGap: 10 }} style={{ marginBottom: 10, height: "8%", width: "100%",  }}>
          <PrimaryButton
            onClick={() => handleOptionClick('FlashCard')}
            styles={{
              root: {
                height: "40px",
                width: "50%",
                background: "transparent",
                borderRadius: 10,
                boxShadow: 'none',
                border: `1px solid ${selectedOption === 'FlashCard' ? 'black' : 'transparent'}`,
                selectors: {
                  ':hover': {
                    background: "transparent",
                  },
                  ':active': {
                    background: "transparent",
                  },
                  ':focus': {
                    background: "transparent",
                  },
                },
              }
            }}
          >
            <Library16Filled />   
            <Text style={{ color:selectedOption==="FlashCard"? "#FFF": '#9A9A90', marginLeft: 10,fontSize:"14px",fontWeight:"600",lineHeight:"20px",fontStyle:"normal" }} >{"Value Props"}</Text>
          </PrimaryButton>
          <PrimaryButton
            onClick={() => handleOptionClick('WalkAround')}
            styles={{
              root: {
                height: "40px",
                width: "50%",
                background: "transparent",
                borderRadius: 5,
                border: `1px solid ${selectedOption === 'WalkAround' ? 'black' : 'transparent'}`,
                color: '#FFFFFF',
                boxShadow: 'none',
                selectors: {
                  ':hover': {
                    background: "transparent",
                  },
                  ':active': {
                    background: "transparent",

                  },
                  ':focus': {
                    background: "transparent",
                  },
                },
              }
            }}
          >
            <VehicleShip16Filled />
            <Text style={{ color:selectedOption==="WalkAround"? "#FFF": '#9A9A90', marginLeft: 10,fontSize:"14px",fontWeight:"600",lineHeight:"20px",fontStyle:"normal" }} >{"Walk Around"}</Text>
          </PrimaryButton>
        </Stack>
        <Stack
          style={{ height: "82%", width: "100%", display: "flex", flexDirection: "column", flexWrap: "wrap", flexFlow: "column", overflowY: "auto", alignItems: "center" }}
          tokens={{ childrenGap: 10 }}
        >
          {selectedOption === 'WalkAround' ? <WalkAround /> : <FlashCard />}
        </Stack>
        <Stack
          tokens={{ childrenGap: 20 }}
          horizontalAlign='center'
          style={{ height: "10%", position: "fixed", bottom: 0 }}
          styles={{ root: { padding: 20, flexWrap: "wrap",
              '@media (max-width: 1000px)': {
                width: "100%",
              },
              '@media (max-width: 2500px) and (min-width: 1000px)': {
                width: "30%",
              },
           } }}
        >
          <PrimaryButton style={{ width: "100%", fontSize: "0.875rem", height: "50px", borderRadius: 10, padding: 20, background: "black", border: "none" }} onClick={handleNextClick}>Submit</PrimaryButton>
        </Stack>
      </Stack>
    </div>
  );
};

export default ProductInformation;
