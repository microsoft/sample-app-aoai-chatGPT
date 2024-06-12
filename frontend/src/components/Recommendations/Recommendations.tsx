import React, { useContext, useEffect, useState } from 'react';
import { Text, Stack, DefaultButton, Image, Spinner, PrimaryButton } from '@fluentui/react';
import styles from '../../pages/chat/Chat.module.css'
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '../../state/AppProvider';
import { getRecommendations } from '../../api';
//import boatImages from '../../constants/boatImages';
import Image1 from "../../assets/boat_images/BlackHullRedAccentsRedBimini_BMT-6911_main.avif"

import R250LE3 from  "../../assets/boat_images/LE35_BMT-6805_alt1.jpeg"
import R250DL3 from  "../../assets/boat_images/DL34_BMT-6803_alt1.jpeg"
import R230DL3 from  "../../assets/boat_images/DL37_BMT-6802_alt1.jpeg"
import TAH16 from  "../../assets/boat_images/WhiteKiwiGraphics_BMT-6808_main.avif"
import TAH18 from  "../../assets/boat_images/RedWhiteBlueGraphics_BMT-6809_main.avif"
//import TAH21 from  "../../assets/boat_images/BlackHullRedAccentsRedBimini_BMT-6911_alt4.avif"
import TAH185 from  "../../assets/boat_images/StormBlue_BMT-6814_main.avif"
import TAH200 from  "../../assets/boat_images/Black_BMT-6815_main.avif"
import TAH210 from  "../../assets/boat_images/BlackRedAccents_BMT-6810_main.avif"
import TAH210SI from  "../../assets/boat_images/TriggerGrayRedAccents_BMT-6811_main.avif"
import TAH1950 from  "../../assets/boat_images/BlackKiwiAccents_BMT-6816_main.avif"
import TAH2150 from  "../../assets/boat_images/BlackKiwiAccents_BMT-6817_main.avif"
import TAH2150CC from  "../../assets/boat_images/GrayMistKiwiAccents_BMT-6818_alt3.avif"
import SFB22 from  "../../assets/boat_images/CharcoalMetallic_BMT-6796_alt1.jpeg"
import SFB22XP3 from  "../../assets/boat_images/IndigoBlue_BMT-6797_alt1.avif"
import SPB18 from  "../../assets/boat_images/CopperRed_BMT-6787_main.jpeg"
import SPB20 from  "../../assets/boat_images/CopperRed_BMT-6788_main.jpeg"
import SPB22 from  "../../assets/boat_images/CharcoalMetallic_BMT-6789_main.jpeg"
import SPB22XP3 from  "../../assets/boat_images/CopperRed_BMT-6790_main.avif"
import SBB16XL from  "../../assets/boat_images/CopperRed_BMT-6793_alt1.jpeg"
import SBB18 from  "../../assets/boat_images/IndigoBlue_BMT-6794_alt2.jpeg"
import SF20 from  "../../assets/boat_images/Black_BMT-6798_alt1.jpeg"
import SF22 from  "../../assets/boat_images/Black_BMT-6799_main.jpeg"
import SF22XP3 from  "../../assets/boat_images/Caribou_BMT-6800_alt1.jpeg"
import SF24XP3 from  "../../assets/boat_images/Caribou_BMT-6801_main.avif"
import SFB20 from  "../../assets/boat_images/IndigoBlue_BMT-6795_main.jpeg"


const boatImages: {[key:string]: string} = {
    "R250 LE3": R250LE3,
    "R250 DL3": R250DL3,
    "R230 DL3": R230DL3,
    "TAH16": TAH16,
    "TAH18": TAH18,
    "TAH185": TAH185,
    "TAH200": TAH200,
    "TAH210": TAH210,
    "TAH210SI": TAH210SI,
    "TAH1950": TAH1950,
    "TAH2150": TAH2150,
    "TAH2150CC": TAH2150CC,
    "SFB22": SFB22,
    "SFB22XP3": SFB22XP3,
    "SPB18": SPB18,
    "SPB20": SPB20,
    "SPB22": SPB22,
    "SPB22XP3": SPB22XP3,
    "SBB16XL": SBB16XL,
    "SBB18": SBB18,
    "SF20": SF20,
    "SF22": SF22,
    "SF22XP3": SF22XP3,
    "SF24XP3": SF24XP3,
    "SFB20": SFB20,
  }

const About: React.FC = () => {
    const navigate = useNavigate();
    const appStateContext = useContext(AppStateContext);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const dummyData = appStateContext?.state?.recommendation;
    const isLoading = appStateContext?.state?.isLoadingRecommendations;
    const promptValue = appStateContext?.state?.promptvalue

    const fetch = async () => {
        try {
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: true })

            const response =await getRecommendations(promptValue || '')
            // const data = {
            //     "output": "{\"value_propositions\": [{\"title\": \"REGENCY 250 LE3 Sport\", \"detail\": \"Offers a luxurious and comfortable experience for a crew of 14, perfect for watersports with its 350-horsepower rating and ski tow pylon.\"}, {\"title\": \"TAHOE 2150\", \"detail\": \"Combines spacious luxury with sporting capability, also featuring the POWERGLIDE\® hull and ski tow pylon, ideal for families enjoying watersports.\"}, {\"title\": \"Sun Tracker Sportfish\", \"detail\": \"A versatile option that combines a fishing boat's utility with the comfort of a party barge, perfect for Lake George outings.\"}]}"
            // }

            const parsedData = JSON.parse(response?.messages);
            const actuallRecommendations = parsedData?.result
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_STATE', payload: actuallRecommendations })
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: false })
            appStateContext?.dispatch({ type: 'SET_CONVERSATION_ID', payload: response?.id })
        } catch (error) {
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: false })
        }
    }

    useEffect(() => {
        fetch()
    }, [])

    const handleBoatSelection = (item: any): void => {
        setSelectedItem(item);
    }

    const handleNextClick = (): void => {
        if (selectedItem) {
            appStateContext?.dispatch({ type: 'SET_SELECTED_BOAT', payload: selectedItem?.title })
            navigate("/productInfo");
        }
    }

    const truncateText = (text: string, maxLength: number) => {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    };

    const normalizeString = (str: string) => {
        return str.replace(/[\s\W]+/g, '').toLowerCase();
    };

    const imagePath = (title: string) => {
        const normalizedTitle = normalizeString(title);
        let bestMatchKey = '';
        let bestMatchLength = 0;
        const key1 = normalizeString("Sun Tracker");
        const key2 = normalizeString("Tahoe");
        const key3 = normalizeString("Regency");

        for (const key in boatImages) {
            const normalizedKey = normalizeString(key);
            if (normalizedKey.includes(normalizedTitle)) {
                if (normalizedKey.length > bestMatchLength) {
                    bestMatchLength = normalizedKey.length;
                    bestMatchKey = key;
                }
            }
        }
        if (bestMatchKey) {
            return boatImages[bestMatchKey]
        }
        else {
            if (normalizedTitle.includes(key1)) {
                return Image1
            } else if (normalizedTitle.includes(key2)) {
                return Image1
            } else if (normalizedTitle.includes(key3)) {
                return Image1
            } else {
                return Image1
            }
        }
    };

    return (
        <div className={styles.chatContainer}>
            {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Spinner styles={{ circle: { height: 40, width: 40, border: "2px solid #FFFFFF" }, label: { color: "#FFFFFF", fontSize: "1rem" } }} label="Loading recommendations..." />
                </div>
            ) : (
                <Stack
                    horizontalAlign="center"
                    styles={{ root: { height: '90vh', marginTop: 20 } }}
                >
                    <Stack
                        tokens={{ childrenGap: 20 }}
                        styles={{ root: { width: '100%', padding: 20, marginTop: 10 } }}
                    >
                        {dummyData && dummyData.length > 0 && (
                            <Text style={{ color: "white", marginBottom: 20 }} variant="xLarge">Top Recommendations for this store</Text>
                        )}
                        {dummyData && dummyData.length > 0 && dummyData.map((item, index) => (
                            <DefaultButton key={index} styles={{ root: { width: '100%', height: "100%", padding: "12px", maxHeight: 150, borderRadius: "20px", backgroundColor: selectedItem === item ? "#FFFFFF" : "#D0D0D0" } }} onClick={() => handleBoatSelection(item)}>
                                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} style={{ width: "100%" }}>
                                    <Image
                                        src={imagePath(item.title)}
                                        alt={item.title}
                                        width={"30%"}
                                        height={100}
                                        styles={{ root: { borderRadius: '14px'} }}
                                    />

                                    <Stack tokens={{ childrenGap: 10 }} style={{ display: "flex", alignItems: "start", justifyContent: "center", textAlign: "initial", width: "70%" }}>
                                        <Text style={{ fontWeight: "700",fontSize:"14px",lineHeight:"20px",fontStyle:"normal",color:"#000" }} >{item.title}</Text>
                                        <Text style={{ fontWeight: "400",fontSize:"12px",lineHeight:"20px",fontStyle:"normal",color:"rgba(0, 0, 0, 0.70)" }}>{truncateText(item.detail, 100)}</Text>
                                    </Stack>
                                </Stack>
                            </DefaultButton>
                        ))}
                    </Stack>
                    {dummyData && dummyData.length === 0 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <Text style={{ fontWeight: "bold", color: "#FFFFFF" }} variant="xLarge" >No Recommendations found</Text>
                        </div>
                    )}
                </Stack>
            )}
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
                <PrimaryButton styles={{label:{fontWeight:"500",fontSize: "0.875rem",lineHeight:"20px"}}} style={{ width: "100%", height: "48px",  borderRadius: 10, padding: "0px 14px", background: selectedItem ? "black" : "#191A1B", opacity: selectedItem ? 1 : 0.5, border: "none" }} onClick={handleNextClick}>Submit</PrimaryButton>
            </Stack>
        </div>
    );
};

export default About;
