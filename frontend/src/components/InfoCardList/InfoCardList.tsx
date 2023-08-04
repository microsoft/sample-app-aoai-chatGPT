import InfoCard, { IInfoCard } from "../InfoCard/InfoCard";
import Azure from "../../assets/Azure.svg";
import Send from "../../assets/Send.svg";
import styles from "./InfoCardList.module.css";


interface IInfoCardList {
    onQuestionReceived: (question: string) => void;
}

const cardList: IInfoCard[] = [
    {
        title: 'Examples',
        icon: Azure,
        onSendQuestion: (question: string) => {
            return;
        },
        details: [
            { 
                info: '"Is alternate side street parking in effect?"',
                icon: Send,
                emitQuestion: true,
            },
            { 
                info: '"I\'d like to start a new cafe and bakery in Manhattan"',
                icon: Send,
                emitQuestion: true,
            },
            { 
                info: 'How do I file a pothole complaint?',
                icon: Send,
                emitQuestion: true,
            }
        ]

    },
    {
        title: 'Capabilities',
        icon: Azure,
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
        icon: Azure,
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
                onSendQuestion={handleSendQuestion}
            />
        ))}
       </div>
    )
};

export default InfoCardList;
