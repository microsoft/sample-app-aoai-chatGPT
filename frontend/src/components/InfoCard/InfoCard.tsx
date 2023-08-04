import { useState } from "react";
import { Card, Icon } from "semantic-ui-react";
import styles from "./InfoCard.module.css";

export interface IInfoCard {
    title: string;
    icon?: string;
    details: Detail[];
    onSendQuestion?: (question: string) => void;
}

interface Detail {
    info: string;
    icon?: string;
    emitQuestion?: boolean;
}

export const InfoCard = ({ title, icon, details, onSendQuestion }: IInfoCard) => {
    const [question, setQuestion] = useState<string>("");

    const handleDetailClick = (detail: Detail) => {
        if (typeof onSendQuestion !== 'function' || !detail.emitQuestion) {
            return;
        }
        setQuestion(detail.info);
        onSendQuestion(detail.info);

    };

    return (
        <Card className={styles.cardContainer} style={{ marginTop: 'unset', height: '350px'}}>
            <Card.Content>
                <Card.Header>
                    {icon && <Icon name="image"/>}
                    {title}
                </Card.Header>
                <Card.Description>
                    {details.map((detail, index) => (
                        <div 
                        key={index} 
                        className="info-item"
                        onClick={() => handleDetailClick(detail)}
                        >
                            <span>{detail.info}</span>
                            {detail.icon && <img src={detail.icon} alt="Icon"/>}

                        </div>
                    ))}
                </Card.Description>
            </Card.Content>
        </Card>
    )
};

export default InfoCard;
