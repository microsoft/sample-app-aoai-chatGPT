import React, { useState } from "react";
import { useSpring, animated } from "react-spring";
import Styles from "./Card.module.css";
import { Stack, Text } from "@fluentui/react";
 
interface CardProps {
  title: string;
  detail: string;
}
 
const Card: React.FC<CardProps> = ({ title, detail }) => {
  const [show, setShown] = useState(false);
 
  const props3 = useSpring({
    transform: show ? "scale(1.03)" : "scale(1)",
    boxShadow: show
      ? "0 20px 25px rgba(0, 0, 0, 0.25)"
      : "0 2px 10px rgba(0, 0, 0, 0.08)",
  });

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
};
 
  return (
    <animated.div
      className={Styles.card}
      style={props3}
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
    >
      <Stack styles={{ root: { display: "flex", flexDirection: "column", height: "100%"} }}>
        <Text styles={{
          root: {
            textAlign: "left",
            '@media (max-width: 600px)': {
              fontWeight: "bold",
              fontSize: "16px",
            },
            '@media (max-width: 1300px) and (min-width: 600px)': {
              fontWeight: "bold",
              fontSize: "24px",
            },
            '@media (max-width: 2500px) and (min-width: 1300px)': {
              fontWeight: "bold",
              fontSize: "32px",
            },
          }
        }}>
          {title}
        </Text>
        <Text styles={{
          root: {
            letterSpacing:"2px",
            marginTop:"auto",
            '@media (max-width: 600px)': {
              fontSize: "15px",
              fontWeight: "500",
            },
            '@media (max-width: 1700px) and (min-width: 600px)': {
              fontWeight: "500",
              fontSize: "24px",
            },
            '@media (max-width: 2500px) and (min-width: 1700px)': {
              fontWeight: "500",
              fontSize: "36px",
            },
          }
        }}>
          {truncateText(detail, 350)}
        </Text>
      </Stack>
    </animated.div>
  );
};
 
export default Card;