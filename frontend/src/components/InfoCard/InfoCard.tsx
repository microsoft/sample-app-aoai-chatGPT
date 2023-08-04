import { useState } from "react";
import { Card, Icon } from "semantic-ui-react";

export interface IInfoCard {
    title: string;
    icon?: string;
    details: Detail[];
    onSendQuestion?: (question: string) => void;
}

interface Detail {
    info: string;
    icon?: string;
}

export const InfoCard = ({ title, icon, details, onSendQuestion }: IInfoCard) => {
    const [question, setQuestion] = useState<string>("");

    const handleDetailClick = (info: string) => {
        setQuestion(info);
        if (typeof onSendQuestion === 'function') {
            onSendQuestion(info);
        }
    };

    return (
        <Card>
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
                        onClick={() => handleDetailClick(detail.info)}
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
