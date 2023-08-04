import InfoCard, { IInfoCard } from "../InfoCard/InfoCard";
import Sparkle from "../../assets/Sparkle.svg";
import Zap from "../../assets/Zap.svg";
import Exclamation from "../../assets/Exclamation.svg";
import RightArrow from "../../assets/RightArrow.svg";
import styles from "./InfoCardList.module.css";


interface IInfoCardList {
    onQuestionReceived: (question: string) => void;
}

const cardList: IInfoCard[] = [
    {
        title: 'Examples',
        icon: Sparkle,
        onSendQuestion: (question: string) => {
            return;
        },
        details: [
            { 
                info: '"Is alternate side street parking in effect?"',
                icon: RightArrow,
                emitQuestion: true,
            },
            { 
                info: '"I\'d like to start a new cafe and bakery in Manhattan"',
                icon: RightArrow,
                emitQuestion: true,
            },
            { 
                info: 'How do I file a pothole complaint?',
                icon: RightArrow,
                emitQuestion: true,
            }
        ]

    },
    {
        title: 'Capabilities',
        icon: Zap,
        details: [
            { 
                info: 'Your conversations are kept private and confidental.',
            },
            { 
                info: 'Trained on validated NYC government information.',
            },
            { 
                info: 'Trained to decline inappropriate requests.',
            }
        ]

    },
    {
        title: 'Limitations',
        icon: Exclamation,
        details: [
            { 
                info: 'May occasionally generate incorrect information.',
            },
            { 
                info: 'May occasionally produce harmful instructions or biased content.',
            },
            { 
                info: 'Limited knowledge of world and events after 2021.',
            }
        ]

    }
];

export const InfoCardList = ({ onQuestionReceived }: IInfoCardList) => {
    const handleSendQuestion = (question: string) => {
        onQuestionReceived(question);
    }

    return (
       <div className={styles.cardListContainer}>
        {cardList.map((card, index) => (
            <InfoCard
                key={index}
                title={card.title}
                icon={card.icon}
                details={card.details}
                isFirstCard={index === 0}
                onSendQuestion={handleSendQuestion}
            />
        ))}
       </div>
    )
};

export default InfoCardList;
