import { useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { SendRegular } from "@fluentui/react-icons";
import Send from "../../assets/Send.svg";
import styles from "./InfoCard.module.css";
import { Card, Icon } from "semantic-ui-react";

interface Props {
    title: string;
    icon?: string;
    details: Detail[];
}

interface Detail {
    info: string;
    icon?: string;
    onSendQuestion?: (question: string) => void;
}

export const InfoCard = ({ title, icon, details }: Props) => {
    const [question, setQuestion] = useState<string>("");

    const handleDetailClick = (info: string, onSendQuestion?: (question: string) => void) => {
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
                        onClick={() => handleDetailClick(detail.info, detail.onSendQuestion)}
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
