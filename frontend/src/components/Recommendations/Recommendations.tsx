import React, { useContext, useEffect, useState } from 'react';
import { Text, Stack, DefaultButton, Image, Spinner, PrimaryButton } from '@fluentui/react';
import styles from '../../pages/chat/Chat.module.css'
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '../../state/AppProvider';
import { getRecommendations } from '../../api';
import commonStyle from "../ProductInformation/ProductInfo.module.css";
import style from "./Recommendations.module.css"

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




const imageClass = mergeStyles({
    width: '30%',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    '@media (max-width: 600px)': {
        height: '72px',
        width: "100px"
    },
    '@media (min-width: 600px) and (max-width: 1000px)': {
        height: '190px !important',
        width: "250px",
        marginLeft: 5,
        padding: "20px"
    },
    '@media (min-width: 1000px) and (max-width: 2500px)': {
        height: '160px !important',
        width: "250px",
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
        height: '200px',
        width: "200px"
    },
    '@media (min-width: 1000px) and (max-width: 2500px)': {
        height: '140px',
        width: "250px"
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
            //     "messages": "{\"result\": "result": [{ "product": "Regency", "model": "230 LE3 Sport", "summary": "Luxury pontoon boat with seating for 14, sleek design, Bluetooth stereo, spacious seat storage, and exhilarating performance for watersports." }, { "product": "Regency", "model": "250 LE3 Sport", "summary": "Luxury pontoon boat with seating for 14, STOW MORE seat storage system, powered Bimini top, and 350-horsepower rating for watersports." }, { "product": "Regency", "model": "DL3 Series", "summary": "Luxurious tritoon with richly appointed interior, plush seating, STOW-MORE hidden storage, soft-touch woven flooring, and Wet Sounds Audio System." }] }}"
            // }
            
            //const response = { "messages": "{\"result\": [{ \"product\": \"Regency\", \"model\": \" Regency 230 LE3 Sport\", \"summary\": \"Luxury pontoon boat with seating for 14, sleek design, Bluetooth stereo, spacious seat storage, and exhilarating performance for watersports.\" }, { \"product\": \"Regency\", \"model\": \"250 LE3 Sport\", \"summary\": \"Luxury pontoon boat with seating for 14, STOW MORE seat storage system, powered Bimini top, and 350-horsepower rating for watersports.\" }, { \"product\": \"Regency\", \"model\": \"DL3 Series\", \"summary\": \"Luxurious tritoon with richly appointed interior, plush seating, STOW-MORE hidden storage, soft-touch woven flooring, and Wet Sounds Audio System.\" }]}" };

           
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
            //appStateContext?.dispatch({ type: 'SET_SELECTED_PRODUCT', payload: selectedProduct })
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

    const imagePath = (product:string, title:string) => {
        const normalizedProduct = normalizeString(product);
        const normalizedTitle = normalizeString(title);
        let bestMatchKey = '';
        let bestMatchLength = 0;
    
        for (const key in boatImages) {
            const normalizedKey = normalizeString(key);
            if (normalizedKey.includes(normalizedProduct) && normalizedKey.includes(normalizedTitle)) {
                if (normalizedKey.length > bestMatchLength) {
                    bestMatchLength = normalizedKey.length;
                    bestMatchKey = key;
                }
            }
        }
        
        console.log({ bestMatchKey, normalizedProduct, normalizedTitle });
        
        if (bestMatchKey) {
            return boatImages[bestMatchKey];
        } else {
            if (normalizedProduct.includes(key1) || normalizedTitle.includes(key1)) {
                return SBB18;
            } else if (normalizedProduct.includes(key2) || normalizedTitle.includes(key2)) {
                return TAH2150;
            } else if (normalizedProduct.includes(key3) || normalizedTitle.includes(key3)) {
                return R230DL3;
            } else {
                return Image1;
            }
        }
    };
    

    const getDisplayTitle = (title:string, product:string) => {
        if (title?.toLowerCase()?.includes(product?.toLowerCase())) {
            return title;
        } else {
            return `${product} - ${title}`;
        }
    };
    

    return (

        <div className={styles.chatContainer}>
            {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Spinner styles={{ circle: { height: 40, width: 40, border: "2px solid #FFFFFF" }, label: { color: "#FFFFFF", fontSize: "1rem" } }} label="Loading recommendations..." />
                </div>
            ) : (
                <Stack className={style.contentMainStackContainer}>
                    <Stack className={style.contentStackContainer}>
                        {dummyData && dummyData.length > 0 && (
                            <div className={commonStyle.headingDiv}>
                                <BackButton onClick={() => navigate("/")}></BackButton>
                                <Text
                                    className={commonStyle.headingText}>Top Recommendations for this store</Text>
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
                                        minHeight: 200
                                    },
                                    '@media (max-width: 2500px) and (min-width: 756px)': {
                                        height:180,
                                        padding: 20,
                                    },
                                    height: "100%", padding: "12px", borderRadius: "20px", backgroundColor: selectedItem === item ? "#FFFFFF" : "#D0D0D0"
                                }
                            }} onClick={() => handleNextClick(item.model,item.product)}>
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
                                            src={imagePath(item.product,item.model)}
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
                                                        fontWeight: "700", fontSize: "14px", lineHeight: "20px", fontStyle: "normal",
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
                                            style={{ color: "#000" }} > { getDisplayTitle(item.model, item.product) } </Text>
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
