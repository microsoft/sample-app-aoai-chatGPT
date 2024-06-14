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
 
  return (
    <animated.div
      className={Styles.card}
      style={props3}
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
    >
      <Stack styles={{ root: { display: "flex", flexDirection: "column", height: "100%" } }}>
        <Text styles={{
          root: {
            height: "20%",
            textAlign: "left",
            marginTop: 30,
            '@media (max-width: 600px)': {
              fontWeight: "bold",
              fontSize: "16px",
            },
            '@media (max-width: 2500px) and (min-width: 600px)': {
              fontWeight: "bold",
              fontSize: "28px",
            },
          }
        }}>
          {title}
        </Text>
        <Text styles={{
          root: {
            '@media (max-width: 600px)': {
              fontSize: "20px",
              fontWeight: "500",
            },
            '@media (max-width: 2500px) and (min-width: 600px)': {
              fontSize: "26px",
              fontWeight: "400",
            },
          }
        }}>
          {detail}
        </Text>
      </Stack>
    </animated.div>
  );
};
 
export default Card;