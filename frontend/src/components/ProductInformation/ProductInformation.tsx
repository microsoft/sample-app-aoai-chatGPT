import React, { useContext, useEffect, useState } from 'react';
import { IIconProps, Icon, PrimaryButton, Stack, Text, css } from '@fluentui/react';
import WalkAround from './WalkAround';
import FlashCard from './FlashCard';
import styles from '../../pages/chat/Chat.module.css'
import { useNavigate } from 'react-router-dom';
import {
  Library16Filled,
  Library24Filled,
  Library28Filled,
  VehicleShip16Filled,
  VehicleShip24Filled
} from '@fluentui/react-icons'
import { AppStateContext } from '../../state/AppProvider';
import { templete2, templete3 } from '../../constants/templete';
import { getValuePropositions, getWalkthroughData } from '../../api';
import BackButton from '../BackButton';
import style from './ProductInfo.module.css';
import PrimaryButtonComponent from '../common/PrimaryButtonComponent';

const ProductInformation: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('FlashCard');
  const navigate = useNavigate();
  const appStateContext = useContext(AppStateContext);
  const selectedboat = appStateContext?.state?.selectedBoat;
  const selectedbrand = appStateContext?.state?.selectedBrand;
  const conversationId = appStateContext?.state?.conversationId;
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const isLoading = appStateContext?.state?.isLoadingValuePropositions
  const walkthroughData = appStateContext?.state?.walkthorugh;
  const valuesProps = appStateContext?.state?.valuePropositions

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    // Cleanup the event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderLibraryIcon = () => {
    if (screenWidth <= 1000) {
      return <Library16Filled />;
    } else if (screenWidth > 1000 && screenWidth <= 2500) {
      return <Library28Filled />;
    }
  };
  const renderBoatIcon = () => {
    if (screenWidth <= 1000) {
      return <VehicleShip16Filled />;
    } else if (screenWidth > 1000 && screenWidth <= 2500) {
      return <VehicleShip24Filled />;
    }
  };


  const fetch = async () => {
    try {
      appStateContext?.dispatch({ type: 'SET_VALUE_PROPOSITION_LOADING', payload: true })
      appStateContext?.dispatch({ type: 'SET_WALKTHROUGH_LOADING', payload: true })

      const valuePropositionsResponse = await getValuePropositions(templete2(selectedboat || "", selectedbrand || ""), conversationId || "")
      // const valuePropositionsResponse = {
      //   messages:
      //     '{"result": [{"title": "SUN TRACKER FLARE touchscreen gauge", "detail": "Offers modern, easy-to-use navigational and control features. Offers modern, easy-to-use navigational and control"}, {"title": "Wet Sounds stereo with Bluetooth & two 6.5\\" upholstery speakers", "detail": "Ensures high-quality audio entertainment on the water"}, {"title": "New motor & adaptor harnesses", "detail": "Improves performance and compatibility with various accessories"},{"title": "SUN TRACKER FLARE touchscreen gauge display & 12-button switch panel", "detail": "Offers modern, easy-to-use navigational and control features"}, {"title": "Wet Sounds stereo with Bluetooth & two 6.5\\" upholstery speakers", "detail": "Ensures high-quality audio entertainment on the water"}, {"title": "New motor & adaptor harnesses", "detail": "Improves performance and compatibility with various accessories"}]}'
      // }
      // const walkaroundResponse = {
      //   messages:
      //     '{"result": [{"title": "Driver Console", "detail": "draulic steering.Features an advanced 8” TAHOE CRUISE® digital touchscreen dashboard for unprecedented insight and control, paired with a sport steering wheel and responsive hydraulic steering.Features an advanced 8” TAHOE CRUISE® digital touchscreen dashboard for unprecedented insight asdfsafdsfsdfaf."}, {"title": "Seating Capacity", "detail": "Accommodates up to 11 passengers in a feature-rich interior, ensuring comfort during full days of cruising and adventure.Features an advanced 8” TAHOE CRUISE® digital touchscreen dashboard for unprecedented insight and control, paired with a sport steering wheel and responsive hydraulic steering."}, {"title": "Entertainment System", "detail": "Equipped with a powerful KICKER® Bluetooth stereo system and an advanced phone management station for all-day entertainment.Features an advanced 8” TAHOE CRUISE® digital touchscreen dashboard for unprecedented insight and control, paired with a sport steering wheel and responsive hydraulic steering."}, {"title": "Storage Solutions", "detail": "Plentiful storage options are available for all your gear, keeping the deck clear and organized.Features an advanced 8” TAHOE CRUISE® digital touchscreen dashboard for unprecedented insight and control, paired with a sport steering wheel and responsive hydraulic steering."}, {"title": "Water Sports Features", "detail": "Comes with a removable ski tow pylon for water sports and adventure."}, {"title": "Swim Platforms", "detail": "Features aft swim platforms with a boarding ladder, making it easy to access the water."}]}'
      // }

      if (valuePropositionsResponse) {
        const parsedDataValueProps = JSON.parse(valuePropositionsResponse?.messages);
        const valuePropositions = parsedDataValueProps?.result
        appStateContext?.dispatch({ type: 'SET_VALUE_PROPOSITION_STATE', payload: valuePropositions })
      }
      const walkaroundResponse = await getWalkthroughData(templete3(selectedboat || "", selectedbrand || ""), conversationId || "")

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
    navigate('/feedback');
  };

  const iconStyles: IIconProps = {
    iconName: 'Library',
    styles: {
      root: {
        '@media (max-width: 600px)': {
          fontWeight: 'bold',
          fontSize: '16px'
        },
        '@media (max-width: 1000px) and (min-width: 600px)': {
          fontWeight: 'bold',
          fontSize: '28px'
        },
        '@media (max-width: 1500px) and (min-width: 1000px)': {
          fontWeight: 'bold',
          fontSize: '28px'
        },
        '@media (max-width: 2500px) and (min-width: 1500px)': {
          fontSize: '30px'
        },
        color: selectedOption !== "FlashCard" ?'#9A9A90' :"#FFFFFF",
        cursor: 'pointer'
      }
    }
  }

  return (
    // <div className={styles.chatContainer}>
      <Stack className={style.mainStackContainer}>
        <Stack className={style.headerMainStackContainer}>
          <Stack className={style.headerStackContainer}>
            <div className={style.headingDiv}>
              <div className={style.backButton}>
              <BackButton onClick={() => navigate('/recommendations')}></BackButton>
              </div>
              <Text
                className={style.headingText}>{(valuesProps && valuesProps?.length > 0 || walkthroughData && walkthroughData?.length > 0) || isLoading ? `${selectedbrand}-${selectedboat}` : "No data found please try again"}</Text>
            </div>
            <Stack
              horizontal
              tokens={{ childrenGap: 10 }}
              style={{ width: '100%', padding: '0px', marginTop: 15}}
            >
              <PrimaryButton
                onClick={() => handleOptionClick('FlashCard')}
                styles={{
                  root: {
                    width: '50%',
                    '@media (max-width: 600px)': {
                      height: '40px'
                    },
                    height: '50px',
                    background: `${selectedOption === 'FlashCard' ? "#202A2F !important" : "transparent"}`,
                    borderRadius: 10,
                    boxShadow: 'none',
                    border: '2px solid #1d262a !important' ,
                    selectors: {
                      ':hover': {
                        background: '#1d262a !important'
                      },
                      ':active': {
                       background: '#1d262a !important'
                      },
                      ':focus': {
                        background: '#1d262a !important'
                      }
                    }
                  }
                }}>
                <Icon {...iconStyles} />
                <Text
                  styles={{
                    root: {
                      '@media (max-width: 600px)': {
                        fontSize: '14px',
                        fontWeight: '600'
                      },
                        fontSize: '20px',
                        fontWeight: '600'
                    }
                  }}
                  style={{
                    color: selectedOption === 'FlashCard' ? '#FFF' : '#9A9A90',
                    marginLeft: 10,
                    lineHeight: '20px',
                    fontStyle: 'normal'
                  }}>
                  {'Value Props'}
                </Text>
              </PrimaryButton>
              <PrimaryButton
                onClick={() => handleOptionClick('WalkAround')}
                styles={{
                  root: {
                    '@media (max-width: 600px)': {
                      height: '40px'
                    },
                    height: '50px',
                    width: '50%',
                    background: `${selectedOption === 'WalkAround' ? "#202A2F !important" : "transparent"}`,
                    borderRadius: 10,
                    border: '2px solid #1d262a !important' ,
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    selectors: {
                      ':hover': {
                        background: '#1d262a !important'
                      },
                      ':active': {
                        background: '#1d262a !important'
                      },
                      ':focus': {
                        background: '#1d262a !important'
                      }
                    }
                  }
                }}>
                {renderBoatIcon()}
                <Text
                  styles={{
                    root: {
                      '@media (max-width: 600px)': {
                        fontSize: '14px',
                        fontWeight: '600'
                      },
                        fontSize: '20px',
                        fontWeight: '600'
                    }
                  }}
                  style={{ color: selectedOption === 'WalkAround' ? '#FFF' : '#9A9A90', marginLeft: 10 }}>
                  {'Walk Around'}
                </Text>
              </PrimaryButton>
            </Stack>
          </Stack>
        </Stack>
        <Stack
          className={selectedOption === 'WalkAround' ? style.contentStackContainerWalkthrough :style.contentMainStackContainer} 
          style={{ justifyContent: isLoading && selectedOption !== 'WalkAround' ? "center" : "" }}
          >
          <Stack
            className={selectedOption !== 'WalkAround' ? style.contentStackContainer : style.walkThroughStackContainer}
          >
            {selectedOption === 'WalkAround' ? <WalkAround /> : <FlashCard />}
          </Stack>
        </Stack>
        <Stack className={style.footerMainStackContainer} >
          <Stack
            className={style.footerStackContainer}>
            <PrimaryButtonComponent label="I'm Done" onClick={handleNextClick} disabled={isLoading || false}/>
          </Stack>
        </Stack>
      </Stack>
    // </div>
  );
};
 
export default ProductInformation;