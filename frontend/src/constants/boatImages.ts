import R250LE3 from  "../../src/assets/boat_images/LE35_BMT-6805_alt1.jpeg"
import R250DL3 from  "../../src/assets/boat_images/DL34_BMT-6803_alt1.jpeg"
import R230DL3 from  "../../src/assets/boat_images/DL37_BMT-6802_alt1.jpeg"
import TAH16 from  "../../src/assets/boat_images/WhiteKiwiGraphics_BMT-6808_main.avif"
import TAH18 from  "../../src/assets/boat_images/RedWhiteBlueGraphics_BMT-6809_main.avif"
//import TAH21 from  "../../src/assets/boat_images/BlackHullRedAccentsRedBimini_BMT-6911_alt4.avif"
import TAH185 from  "../../src/assets/boat_images/StormBlue_BMT-6814_main.avif"
import TAH200 from  "../../src/assets/boat_images/Black_BMT-6815_main.avif"
import TAH210 from  "../../src/assets/boat_images/BlackRedAccents_BMT-6810_main.avif"
import TAH210SI from  "../../src/assets/boat_images/TriggerGrayRedAccents_BMT-6811_main.avif"
import TAH1950 from  "../../src/assets/boat_images/BlackKiwiAccents_BMT-6816_main.avif"
import TAH2150 from  "../../src/assets/boat_images/BlackKiwiAccents_BMT-6817_main.avif"
import TAH2150CC from  "../../src/assets/boat_images/GrayMistKiwiAccents_BMT-6818_alt3.avif"
import SFB22 from  "../../src/assets/boat_images/CharcoalMetallic_BMT-6796_alt1.jpeg"
import SFB22XP3 from  "../../src/assets/boat_images/IndigoBlue_BMT-6797_alt1.avif"
import SPB18 from  "../../src/assets/boat_images/CopperRed_BMT-6787_main.jpeg"
import SPB20 from  "../../src/assets/boat_images/CopperRed_BMT-6788_main.jpeg"
import SPB22 from  "../../src/assets/boat_images/CharcoalMetallic_BMT-6789_main.jpeg"
import SPB22XP3 from  "../../src/assets/boat_images/CopperRed_BMT-6790_main.avif"
import SBB16XL from  "../../src/assets/boat_images/CopperRed_BMT-6793_alt1.jpeg"
import SBB18 from  "../../src/assets/boat_images/IndigoBlue_BMT-6794_alt2.jpeg"
import SF20 from  "../../src/assets/boat_images/Black_BMT-6798_alt1.jpeg"
import SF22 from  "../../src/assets/boat_images/Black_BMT-6799_main.jpeg"
import SF22XP3 from  "../../src/assets/boat_images/Caribou_BMT-6800_alt1.jpeg"
import SF24XP3 from  "../../src/assets/boat_images/Caribou_BMT-6801_main.avif"
import SFB20 from  "../../src/assets/boat_images/IndigoBlue_BMT-6795_main.jpeg"

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

// const boatImages: { [key: string]: string } = {
//     "R250 LE3": "../../src/assets/boat_images/LE35_BMT-6805_alt1.jpeg",
//     "R250 DL3": "../../src/assets/boat_images/DL34_BMT-6803_alt1.jpeg",
//     "R230 DL3": "../../src/assets/boat_images/DL37_BMT-6802_alt1.jpeg",
//     "R230 LE3": "../../src/assets/boat_images/boat3.jpg",//no image
//     "TAH16": "../../src/assets/boat_images/WhiteKiwiGraphics_BMT-6808_main.avif",
//     "TAH18": "../../src/assets/boat_images/RedWhiteBlueGraphics_BMT-6809_main.avif",
//     "TAH21": "../../src/assets/boat_images/BlackHullRedAccentsRedBimini_BMT-6911_alt4.avif",
//     "TAH185": "../../src/assets/boat_images/StormBlue_BMT-6814_main.avif",
//     "TAH200": "../../src/assets/boat_images/Black_BMT-6815_main.avif",
//     "TAH210": "../../src/assets/boat_images/BlackRedAccents_BMT-6810_main.avif",
//     "TAH210SI": "../../src/assets/boat_images/TriggerGrayRedAccents_BMT-6811_main.avif",
//     "TAH1950": "../../src/assets/boat_images/BlackKiwiAccents_BMT-6816_main.avif",
//     "TAH2150": "../../src/assets/boat_images/BlackKiwiAccents_BMT-6817_main.avif",
//     "TAH2150CC": "../../src/assets/boat_images/GrayMistKiwiAccents_BMT-6818_alt3.avif",
//     "SFB22": "../../src/assets/boat_images/CharcoalMetallic_BMT-6796_alt1.jpeg",
//     "SFB22XP3": "../../src/assets/boat_images/IndigoBlue_BMT-6797_alt1.avif",
//     "SPB18": "../../src/assets/boat_images/CopperRed_BMT-6787_main.jpeg",
//     "SPB20": "../../src/assets/boat_images/CopperRed_BMT-6788_main.jpeg",
//     "SPB22": "../../src/assets/boat_images/CharcoalMetallic_BMT-6789_main.jpeg",
//     "SPB22XP3": "../../src/assets/boat_images/CopperRed_BMT-6790_main.avif",
//     "SBB16XL": "../../src/assets/boat_images/CopperRed_BMT-6793_alt1.jpeg",
//     "SBB18": "../../src/assets/boat_images/IndigoBlue_BMT-6794_alt2.jpeg",
//     "SF20": "../../src/assets/boat_images/Black_BMT-6798_alt1.jpeg",
//     "SF22": "../../src/assets/boat_images/Black_BMT-6799_main.jpeg",
//     "SF22XP3": "../../src/assets/boat_images/Caribou_BMT-6800_alt1.jpeg",
//     "SF24XP3": "../../src/assets/boat_images/Caribou_BMT-6801_main.avif",
//     "SFB20": "../../src/assets/boat_images/IndigoBlue_BMT-6795_main.jpeg",
//     "SPB24": "../../src/assets/boat_images/GrayMistKiwiAccents_BMT-6818_alt3",//no image
//     "SPB16": "../../src/assets/boat_images/GrayMistKiwiAccents_BMT-6818_alt3",//no image 
//   };
  
  export default boatImages;
  