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
import NoDataGif from "../../assets/noData.gif"
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
import PrimaryButtonComponent from '../common/PrimaryButtonComponent';


const boatImages: {[key:string]: string} = {
    "Regency 250 LE3": R250LE3,
    "Regency LE3 Series": R250LE3,
    "Regency 250 DL3": R250DL3,
    "Regency 230 DL3": R230DL3,
    "230 DL3": R230DL3,
    "Regency DL3 Series": R230DL3,
    "DL3 Series": R230DL3,
    "PONTOON ELITE": R250DL3,
    "Elite": R250DL3,
    "250 LE3 Sport": R250LE3,
    "230 LE3 Sport": R250LE3,
    "230 LE 3 Sport": R250LE3,
    "Tahoe 16": TAH16,
    "Tahoe 18": TAH18,
    "Tahoe 185": TAH185,
    "TAH16": TAH16,
    "TAH18": TAH18,
    "TAH185": TAH185,
    "185 S": TAH185,
    "T21": TAH210,
    "Tahoe 200": TAH200,
    "Tahoe 210": TAH210,
    "Tahoe 210 S": TAH210SI,
    "210 S Limited": TAH210SI,
    "Tahoe 210 SI": TAH210SI,
    "Tahoe 210 SI LIMITED": TAH210SI,
    "Tahoe 1950": TAH1950,
    "Tahoe 2150": TAH2150,
    "Tahoe 2150 CC": TAH2150CC,
    "SFB22": SFB22,
    "SFB22XP3": SFB22XP3,
    "SPB18": SPB18,
    "SPB20": SPB20,
    "SPB22": SPB22,
    "SPB24": SF24XP3,
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
    "Sun Tracker Fishin' Barge 22 DLX": SFB22,
    "Sun Tracker Fishing Barge 18": SPB18,
    "Sun Tracker Fishin' Barge 18": SPB18,
    "Sun Tracker Party Barge 20": SPB20,
    "Sun Tracker Party Barge 20 DLX": SPB20,
    "Party Barge 20 DLX": SPB20,
    "Party Barge 24 DLX": SF24XP3,
    "Party Barge 24": SF24XP3,
    "Party Barge 24 XP3": SF24XP3,
    "Party Barge 22": SPB22,
    "Party Barge 18 DLX": SPB20,
    "Party Barge 22XP3": SPB22XP3,
    "Sun Tracker Party Barge 22": SPB22,
    "Sun Tracker Party Barge 22XP3": SPB22XP3,
    "SportFish 20": SF20,
    "SportFish 20 DLX": SF20,
    "SportFish 22": SF22,
    "SportFish 22 DLX": SF22,
    "SportFish 22 XP3": SF22XP3,
    "BASS BUGGY 16 XL SELECT":SF22,
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
    '.ms-Image > img':{
        width:"100%",
        objectFit:"contain"
    }
});

const About: React.FC = () => {
    const navigate = useNavigate();
    const appStateContext = useContext(AppStateContext);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [userCity,setUserCity]=useState<string>("");
    const dummyData = appStateContext?.state?.recommendation;
    const isLoading = appStateContext?.state?.isLoadingRecommendations;
    const promptValue = appStateContext?.state?.promptvalue

    const fetch = async () => {
        try {
            if ((dummyData && dummyData.length === 0)) {
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: true })
            const userCityStored=localStorage.getItem("userInfo");
            let city;
            if(userCityStored){
            city=JSON.parse(userCityStored);
            }
            const response =await getRecommendations(promptValue || '',city[0].name || "")
            // const response = {
            //     "messages": "{\"result\":[{\"brand\": \"Regency\", \"model\": \"Regency 250 LE3\", \"summary\": \"Summary for Regency 250 LE3\"}, {\"brand\": \"Regency\", \"model\": \"Regency LE3 Series\", \"summary\": \"Summary for Regency LE3 Series\"}, {\"brand\": \"Regency\", \"model\": \"Regency 250 DL3\", \"summary\": \"Summary for Regency 250 DL3\"}, {\"brand\": \"Regency\", \"model\": \"Regency 230 DL3\", \"summary\": \"Summary for Regency 230 DL3\"}, {\"brand\": \"Regency\", \"model\": \"230 DL3\", \"summary\": \"Summary for 230 DL3\"}, {\"brand\": \"Regency\", \"model\": \"Regency DL3 Series\", \"summary\": \"Summary for Regency DL3 Series\"}, {\"brand\": \"Regency\", \"model\": \"DL3 Series\", \"summary\": \"Summary for DL3 Series\"}, {\"brand\": \"Regency\", \"model\": \"PONTOON ELITE\", \"summary\": \"Summary for PONTOON ELITE\"}, {\"brand\": \"Regency\", \"model\": \"Elite\", \"summary\": \"Summary for Elite\"}, {\"brand\": \"Regency\", \"model\": \"250 LE3 Sport\", \"summary\": \"Summary for 250 LE3 Sport\"}, {\"brand\": \"Regency\", \"model\": \"230 LE3 Sport\", \"summary\": \"Summary for 230 LE3 Sport\"}, {\"brand\": \"Regency\", \"model\": \"230 LE 3 Sport\", \"summary\": \"Summary for 230 LE 3 Sport\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 16\", \"summary\": \"Summary for Tahoe 16\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 18\", \"summary\": \"Summary for Tahoe 18\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 185\", \"summary\": \"Summary for Tahoe 185\"}, {\"brand\": \"Tahoe\", \"model\": \"TAH16\", \"summary\": \"Summary for TAH16\"}, {\"brand\": \"Tahoe\", \"model\": \"TAH18\", \"summary\": \"Summary for TAH18\"}, {\"brand\": \"Tahoe\", \"model\": \"TAH185\", \"summary\": \"Summary for TAH185\"}, {\"brand\": \"Tahoe\", \"model\": \"185 S\", \"summary\": \"Summary for 185 S\"}, {\"brand\": \"Tahoe\", \"model\": \"T21\", \"summary\": \"Summary for T21\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 200\", \"summary\": \"Summary for Tahoe 200\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 210\", \"summary\": \"Summary for Tahoe 210\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 210 S\", \"summary\": \"Summary for Tahoe 210 S\"}, {\"brand\": \"Tahoe\", \"model\": \"210 S Limited\", \"summary\": \"Summary for 210 S Limited\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 210 SI\", \"summary\": \"Summary for Tahoe 210 SI\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 210 SI LIMITED\", \"summary\": \"Summary for Tahoe 210 SI LIMITED\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 1950\", \"summary\": \"Summary for Tahoe 1950\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 2150\", \"summary\": \"Summary for Tahoe 2150\"}, {\"brand\": \"Tahoe\", \"model\": \"Tahoe 2150 CC\", \"summary\": \"Summary for Tahoe 2150 CC\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SFB22\", \"summary\": \"Summary for SFB22\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SFB22XP3\", \"summary\": \"Summary for SFB22XP3\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SPB18\", \"summary\": \"Summary for SPB18\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SPB20\", \"summary\": \"Summary for SPB20\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SPB22\", \"summary\": \"Summary for SPB22\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SPB24\", \"summary\": \"Summary for SPB24\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SPB22XP3\", \"summary\": \"Summary for SPB22XP3\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SBB16XL\", \"summary\": \"Summary for SBB16XL\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SBB18\", \"summary\": \"Summary for SBB18\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SF20\", \"summary\": \"Summary for SF20\"}, {\"brand\": \"Sun Tracker\", \"model\": \"SF22\", \"summary\": \"Summary for SF22\"}, {\"brand\": \"SF22XP3\", \"model\": \"SF22XP3\", \"summary\": \"Summary for SF22XP3\"}, {\"brand\": \"SF24XP3\", \"model\": \"SF24XP3\", \"summary\": \"Summary for SF24XP3\"}, {\"brand\": \"SFB20\", \"model\": \"SFB20\", \"summary\": \"Summary for SFB20\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Fishing Barge 22\", \"summary\": \"Summary for Sun Tracker Fishing Barge 22\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Fishin' Barge 22\", \"summary\": \"Summary for Sun Tracker Fishin' Barge 22\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Fishin' Barge 22 DLX\", \"summary\": \"Summary for Sun Tracker Fishin' Barge 22 DLX\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Fishing Barge 18\", \"summary\": \"Summary for Sun Tracker Fishing Barge 18\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Fishin' Barge 18\", \"summary\": \"Summary for Sun Tracker Fishin' Barge 18\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Party Barge 20\", \"summary\": \"Summary for Sun Tracker Party Barge 20\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Party Barge 20 DLX\", \"summary\": \"Summary for Sun Tracker Party Barge 20 DLX\"}, {\"brand\": \"Party Barge\", \"model\": \"Party Barge 20 DLX\", \"summary\": \"Summary for Party Barge 20 DLX\"}, {\"brand\": \"Party Barge\", \"model\": \"Party Barge 24 DLX\", \"summary\": \"Summary for Party Barge 24 DLX\"}, {\"brand\": \"Party Barge\", \"model\": \"Party Barge 24\", \"summary\": \"Summary for Party Barge 24\"}, {\"brand\": \"Party Barge\", \"model\": \"Party Barge 24 XP3\", \"summary\": \"Summary for Party Barge 24 XP3\"}, {\"brand\": \"Party Barge\", \"model\": \"Party Barge 22\", \"summary\": \"Summary for Party Barge 22\"}, {\"brand\": \"Party Barge\", \"model\": \"Party Barge 18 DLX\", \"summary\": \"Summary for Party Barge 18 DLX\"}, {\"brand\": \"Party Barge\", \"model\": \"Party Barge 22XP3\", \"summary\": \"Summary for Party Barge 22XP3\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Party Barge 22\", \"summary\": \"Summary for Sun Tracker Party Barge 22\"}, {\"brand\": \"Sun Tracker\", \"model\": \"Sun Tracker Party Barge 22XP3\", \"summary\": \"Summary for Sun Tracker Party Barge 22XP3\"}, {\"brand\": \"SportFish\", \"model\": \"SportFish 20\", \"summary\": \"Summary for SportFish 20\"}, {\"brand\": \"SportFish\", \"model\": \"SportFish 20 DLX\", \"summary\": \"Summary for SportFish 20 DLX\"}, {\"brand\": \"SportFish\", \"model\": \"SportFish 22\", \"summary\": \"Summary for SportFish 22\"}, {\"brand\": \"SportFish\", \"model\": \"SportFish 22 DLX\", \"summary\": \"Summary for SportFish 22 DLX\"}, {\"brand\": \"SportFish\", \"model\": \"SportFish 22 XP3\", \"summary\": \"Summary for SportFish 22 XP3\"}]}"
            // }
           
            const parsedData = JSON.parse(response?.messages);
            const actuallRecommendations = parsedData?.result
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_STATE', payload: actuallRecommendations })
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: false })
            appStateContext?.dispatch({ type: 'SET_CONVERSATION_ID', payload: response?.id })
        }
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
            appStateContext?.dispatch({ type: 'SET_SELECTED_BOAT', payload: selectedItem.toUpperCase() })
            appStateContext?.dispatch({ type: 'SET_SELECTED_BRAND', payload: selectedProduct.toUpperCase() })
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
            if (matchScore > bestMatchScore && matchScore  > 2) {
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

    const getDisplayTitle = (title: string, brand: string) => {
        if (title?.toLowerCase()?.includes(brand?.toLowerCase())) {
            return title.toUpperCase();
        } else {
            return `${brand.toUpperCase()} - ${title.toUpperCase()}`;
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
                                <BackButton onClick={() => {appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_STATE', payload: []})
                                 navigate("/")}}></BackButton>
                                <Text
                                    className={commonStyle.headingText}>Top Recommendations</Text>
                            </div>
                            </div>
                        )}
                        {dummyData && dummyData.length > 0 && dummyData.map((item, index) => (
                            <DefaultButton key={index} styles={{
                                root: {
                                    width: '100%',
                                    '@media (max-width: 376px)': {
                                        minHeight: 150,
                                        padding:"0px 0px 0px 20px"
                                    },
                                    '@media (max-width: 599px) and (min-width: 377px)': {
                                        minHeight: 150,
                                        padding:"10px 10px 10px 18px"
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
                                        // '@media (max-width: 600px)': {
                                        //     maxHeight: 150
                                        // },
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
                                        style={{ display: "flex", alignItems: "start", justifyContent: "center", textAlign: "initial", width: "100%", marginLeft: 0, padding:"15px 0px 15px 15px", }}
                                        styles={{
                                            root: {
                                                '@media (max-width: 1000px)': {
                                                },
                                                '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                   padding:"15px 0px 15px 25px !important"
                                                },
                                            }
                                        }}>
                                        <Text
                                            styles={{
                                                root: {
                                                    marginBottom: 10,
                                                    fontWeight: "bold",
                                                    '@media (max-width: 376px)': {
                                                        marginBottom: 5,
                                                        fontSize: "12px", lineHeight: "16px",
                                                    },
                                                    '@media (max-width: 599px) and (min-width: 377px)': {
                                                        fontSize: "14px", lineHeight: "18px"
                                                    },
                                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                                        fontSize: "18px", lineHeight: "22px"
                                                    },
                                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                         fontSize: "20px", lineHeight: "24px"
                                                        
                                                    },
                                                }
                                            }}
                                            style={{ color: "#000" }} > { getDisplayTitle(item.model, item.brand) } </Text>
                                        <Text
                                            styles={{
                                                root: {
                                                    marginTop: 0,fontSize: "16px", lineHeight: "24px",
                                                    '@media (max-width: 600px)': {
                                                        fontSize: "12px", lineHeight: "18px",
                                                    },
                                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                                        fontSize: "14px", lineHeight: "22px",
                                                    },
                                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                        // fontSize: "16px", lineHeight: "24px",
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",gap:10,height: "calc(100vh - 100px)" ,flexDirection:"column"}}>
                        <img src={NoDataGif} alt="Logo"  style={{opacity:"0.3",width:"100px",marginBottom:20}} />
                        <Text className={commonStyle.noDataText} style={{textAlign:'center',padding:"0px 20px"}}>We couldn't find any boats that meet your needs.</Text>
                        <Text className={commonStyle.noDataText} style={{textAlign:'center',padding:"0px 20px",marginBottom:14}}>Please try different inputs.</Text>
                        <PrimaryButtonComponent label="Go Back" onClick={()=>navigate("/")} disabled={false} width='fit-content'/>
                    </div>
                    )}
                </Stack>
            )}
        </div>
    );

}

export default About;
