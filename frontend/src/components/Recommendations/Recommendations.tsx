import React, { useContext, useEffect, useState } from 'react';
import { Text, Stack, DefaultButton, Image, Spinner, PrimaryButton } from '@fluentui/react';
import styles from '../../pages/chat/Chat.module.css'
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '../../state/AppProvider';
import { getRecommendations } from '../../api';
import commonStyle from "../ProductInformation/ProductInfo.module.css";
import style from "./Recommendations.module.css"
import loading from "../../assets/loader.gif"
//import boatImages from '../../constants/boatImages';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import BackButton from '../BackButton';
import Image1 from "../../assets/BlackHullRedAccentsRedBimini_BMT-6911_main.avif"

import R250LE3 from  "../../assets/LE35_BMT-6805_alt1.jpeg"
import R250DL3 from  "../../assets/DL34_BMT-6803_alt1.jpeg"
import R230DL3 from  "../../assets/DL37_BMT-6802_alt1.jpeg"
import TAH16 from  "../../assets/WhiteKiwiGraphics_BMT-6808_main.avif"
import TAH18 from  "../../assets/RedWhiteBlueGraphics_BMT-6809_main.avif"
//import TAH21 from  "../../assets/boat_images/BlackHullRedAccentsRedBimini_BMT-6911_alt4.avif"
import TAH185 from  "../../assets/StormBlue_BMT-6814_main.avif"
import TAH200 from  "../../assets/Black_BMT-6815_main.avif"
import TAH210 from  "../../assets/BlackRedAccents_BMT-6810_main.avif"
import TAH210SI from  "../../assets/TriggerGrayRedAccents_BMT-6811_main.avif"
import TAH1950 from  "../../assets/BlackKiwiAccents_BMT-6816_main.avif"
import TAH2150 from  "../../assets/BlackKiwiAccents_BMT-6817_main.avif"
import TAH2150CC from  "../../assets/GrayMistKiwiAccents_BMT-6818_alt3.avif"
import SFB22 from  "../../assets/CharcoalMetallic_BMT-6796_alt1.jpeg"
import SFB22XP3 from  "../../assets/IndigoBlue_BMT-6797_alt1.avif"
import SPB18 from  "../../assets/CopperRed_BMT-6787_main.jpeg"
import SPB20 from  "../../assets/CopperRed_BMT-6788_main.jpeg"
import SPB22 from  "../../assets/CharcoalMetallic_BMT-6789_main.jpeg"
import SPB22XP3 from  "../../assets/CopperRed_BMT-6790_main.avif"
import SBB16XL from  "../../assets/CopperRed_BMT-6793_alt1.jpeg"
import SBB18 from  "../../assets/IndigoBlue_BMT-6794_alt2.jpeg"
import SF20 from  "../../assets/Black_BMT-6798_alt1.jpeg"
import SF22 from  "../../assets/Black_BMT-6799_main.jpeg"
import SF22XP3 from  "../../assets/Caribou_BMT-6800_alt1.jpeg"
import SF24XP3 from  "../../assets/Caribou_BMT-6801_main.avif"
import SFB20 from  "../../assets/IndigoBlue_BMT-6795_main.jpeg"


const boatImages: {[key:string]: string} = {
    "Regency 250 LE3": R250LE3,
    "Regency LE3 Series": R250LE3,
    "Regency 250 DL3": R250DL3,
    "Regency 230 DL3": R230DL3,
    "Regency DL3 Series": R230DL3,
    "Tahoe 16": TAH16,
    "Tahoe 18": TAH18,
    "Tahoe 185": TAH185,
    "Tahoe 200": TAH200,
    "Tahoe 210": TAH210,
    "Tahoe 210 SI": TAH210SI,
    "Tahoe 1950": TAH1950,
    "Tahoe 2150": TAH2150,
    "Tahoe 2150 CC": TAH2150CC,
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
    "Sun Tracker Fishing Barge 22": SFB22,
    "Sun Tracker Fishin' Barge 22": SFB22,
    "Sun Tracker Fishing Barge 18": SPB18,
    "Sun Tracker Fishin' Barge 18": SPB18,
    "Sun Tracker Party Barge 20": SPB20,
    "Sun Tracker Party Barge 20 DLX": SPB20,
    "Sun Tracker Party Barge 22": SPB22,
    "Sun Tracker Party Barge 22XP3": SPB22XP3,
    "SportFish 20": SF20,
    "SportFish 22": SF22,
    "SportFish 22 DLX": SF22,
    "SportFish 22XP3": SF22XP3,
    "SportFish 24XP3": SF24XP3,
    "SportFish 24 XP3": SF24XP3,
    "Sun Tracker Fishing Barge 20": SFB20,
    "Sun Tracker Fishin' Barge 20": SFB20,
  }




const imageClass = mergeStyles({
    width: '30%',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    '@media (max-width: 600px)': {
        height: '72px',
        width: "100px"
    },
    '@media (min-width: 600px) and (max-width: 1000px)': {
        height: '130px !important',
        width: "200px",
        marginLeft: 5,
        padding: "20px"
    },
    '@media (min-width: 1000px) and (max-width: 2500px)': {
        height: '120px !important',
        width: "200px",
        marginLeft: 5,
        padding: "20px"
    },
});

const divClass = mergeStyles({
    background: "#FFFFFF", width: "100px", height: "100px", borderRadius: '14px', display: "flex", alignItems: "center", justifyContent: "center",
    '@media (max-width: 600px)': {
        height: '100px',
        width: "100px"
    },
    '@media (min-width: 600px) and (max-width: 1000px)': {
        height: '130px',
        width: "150px"
    },
    '@media (min-width: 1000px) and (max-width: 2500px)': {
        height: '120px',
        width: "200px"
    },
});

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
            // const response = {
            //     "messages": "{\"result\":[{\"brand\": \"Regency\", \"model\": \"SFB20\", \"summary\": \"Luxury pontoon boat with seating for 14, sleek design, Bluetooth stereo, spacious seat storage, and exhilarating performance for watersports.\"}, {\"brand\": \"Sun Tracker\", \"model\": \"250 LE3 Sport\", \"summary\": \"Luxury pontoon boat with seating for 14, STOW MORE seat storage system, powered Bimini top, and 350-horsepower rating for watersports.\"}, {\"brand\": \"Tahao\", \"model\": \"DL3 Series\", \"summary\": \"Luxurious tritoon with richly appointed interior, plush seating, STOW-MORE hidden storage, soft-touch woven flooring, and Wet Sounds Audio System.\"}]}"
            // };
           
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

    const handleNextClick = (selectedItem: string, selectedProduct: string): void => {
        if (selectedItem) {
            appStateContext?.dispatch({ type: 'SET_SELECTED_BOAT', payload: selectedItem })
            appStateContext?.dispatch({ type: 'SET_SELECTED_BRAND', payload: selectedProduct })
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
    const key1 = normalizeString("Sun Tracker");
    const key2 = normalizeString("Tahoe");
    const key3 = normalizeString("Regency");

    const calculateMatchScore = (key: string, parts: string[]): number => {
        let score = 0;
        parts.forEach(part => {
            if (key.includes(part)) {
                score += part.length;
            }
        });
        return score;
    };
   
    // Function to get image path based on product and model
    const imagePath = (brand:string, model:string) => {
        const normalizedBrand = normalizeString(brand);
        const normalizedModel = normalizeString(brand + model);
        const modelParts = model.split(/[\s\W]+/).map(part => part.toLowerCase());
   
        let bestMatchKey = '';
        let bestMatchScore = 0;
   
        // Check each key in boatImages
        for (const key in boatImages) {
            const normalizedKey = normalizeString(key);
            const matchScore = calculateMatchScore(normalizedKey, modelParts);
            console.log(normalizedBrand,normalizedModel,modelParts,matchScore,normalizedKey)
            if (matchScore > bestMatchScore && bestMatchScore  > 2) {
                bestMatchScore = matchScore;
                bestMatchKey = key;
            }
        }
   
        // If no match is found, fall back to default images based on product
        if (!bestMatchKey) {
            const key1 = normalizeString("Sun Tracker");
            const key2 = normalizeString("Tahoe");
            const key3 = normalizeString("Regency");
   
            if (normalizedBrand.includes(key1)) {
                return SBB18;
            } else if (normalizedBrand.includes(key2)) {
                return TAH2150;
            } else if (normalizedBrand.includes(key3)) {
                return R230DL3;
            } else {
                return Image1;
            }
        }
   
        return boatImages[bestMatchKey];
    };

    const getDisplayTitle = (title:string, brand:string) => {
        if (title?.toLowerCase()?.includes(brand?.toLowerCase())) {
            return title;
        } else {
            return `${brand} - ${title}`;
        }
    };
    

    return (

        <div className={styles.chatContainer}>
            {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 100px)" }}>
                    <img src={loading} alt="Logo" className="logo" style={{opacity:"0.3",width:"300px"}} />
                </div>
            ) : (
                <Stack className={style.contentMainStackContainer}>
                    <Stack className={style.contentStackContainer}>
                        {dummyData && dummyData.length > 0 && (
                            <div className={style.headingMainDiv}>
                            <div className={commonStyle.headingDiv}>
                                <BackButton onClick={() => navigate("/")}></BackButton>
                                <Text
                                    className={commonStyle.headingText}>Top Recommendations for this store</Text>
                            </div>
                            </div>
                        )}
                        {dummyData && dummyData.length > 0 && dummyData.map((item, index) => (
                            <DefaultButton key={index} styles={{
                                root: {
                                    width: '100%',
                                    '@media (max-width: 600px)': {
                                        maxHeight: 150
                                    },
                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                        // minHeight: 200
                                        height:180,

                                    },
                                    '@media (max-width: 2500px) and (min-width: 756px)': {
                                        height:160,
                                        padding: 20,
                                    },
                                    height: "100%", padding: "12px", borderRadius: "20px", backgroundColor: selectedItem === item ? "#FFFFFF" : "#D0D0D0"
                                }
                            }} onClick={() => handleNextClick(item.model,item.brand)}>
                                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} style={{ width: "100%" }} styles={{
                                    root: {
                                        '@media (max-width: 600px)': {
                                            maxHeight: 150
                                        },
                                        '@media (max-width: 1000px) and (min-width: 600px)': {
                                            minHeight: 200
                                        },
                                        '@media (max-width: 2500px) and (min-width: 1000px)': {
                                            minHeight: 200
                                        },
                                    }
                                }}>
                                    <div className={divClass}>
                                        <Image
                                            src={imagePath(item.brand,item.model)}
                                            alt={item.model}
                                            height={72}
                                            className={imageClass}
                                        />
                                    </div>
 
                                    <Stack tokens={{ childrenGap: 10 }}
                                        style={{ display: "flex", alignItems: "start", justifyContent: "center", textAlign: "initial", width: "100%", marginLeft: 15 }}
                                        styles={{
                                            root: {
                                                '@media (max-width: 1000px)': {
                                                    marginLeft: 10
                                                },
                                                '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                    marginLeft: 20,
                                                    padding: "18px"
                                                },
                                            }
                                        }}>
                                        <Text
                                            styles={{
                                                root: {
                                                    '@media (max-width: 600px)': {
                                                        fontWeight: "700", fontSize: "14px", lineHeight: "30px", fontStyle: "normal",
                                                    },
                                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                                        fontWeight: "bold", fontSize: "24px", lineHeight: "20px", fontStyle: "normal",
                                                        marginBottom: 20
                                                    },
                                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                        fontWeight: "bold", fontSize: "20px", lineHeight: "20px", fontStyle: "normal",
                                                        marginBottom: 20
                                                    },
                                                }
                                            }}
                                            style={{ color: "#000" }} > { getDisplayTitle(item.model, item.brand) } </Text>
                                        <Text
                                            styles={{
                                                root: {
                                                    marginTop: 0,
                                                    '@media (max-width: 600px)': {
                                                        fontWeight: "500", fontSize: "12px", lineHeight: "18px", fontStyle: "normal",
                                                    },
                                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                                        fontWeight: "500", fontSize: "18px", lineHeight: "30px", fontStyle: "normal",
                                                    },
                                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                        fontWeight: "500", fontSize: "16px", lineHeight: "24px", fontStyle: "normal",
                                                    },
                                                }
                                            }}
                                            style={{ color: "rgba(0, 0, 0, 0.70)", marginTop: 0 }}>{truncateText(item.summary, 130)}</Text>
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
        </div>
    );

}

export default About;
