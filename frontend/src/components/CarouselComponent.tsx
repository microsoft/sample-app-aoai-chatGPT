import React, { useState, useEffect } from "react";
import Carousel from "react-spring-3d-carousel";
import { useSpring, animated } from "react-spring";
import { useDrag } from "react-use-gesture";
import { config } from "react-spring";
import style from "./Card.module.css";

interface Card {
  content: JSX.Element;
  onClick: () => void;
}

interface CarrousselProps {
  cards: Card[];
  width: string;
  height: string;
  margin: string;
  offset: number;
  showArrows: boolean;
}

export default function CarouselComponent(props: CarrousselProps) {
  const [offsetRadius, setOffsetRadius] = useState<number>(2);
  const [showArrows, setShowArrows] = useState<boolean>(false);
  const [goToSlide, setGoToSlide] = useState<number>(0);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    setOffsetRadius(props.offset);
    setShowArrows(props.showArrows);
    setCards(props.cards.map((element, index) => {
      return { ...element, onClick: () => setGoToSlide(index) };
    }));
  }, [props.offset, props.showArrows, props.cards]);

  const bind = useDrag(({ down, movement: [mx] }) => {
    if (!down) {
      const newIndex = mx > 0 ? goToSlide - 1 : goToSlide + 1;
      if (newIndex >= 0 && newIndex < cards.length) {
        setGoToSlide(newIndex);
      }
    }
  });

  return (
    <div className={style.carouselWrapper}
      {...bind()}
      style={{ width: props.width, height: props.height, margin: props.margin, touchAction: 'pan-y' }}
    >
      <Carousel
        slides={cards}
        goToSlide={goToSlide}
        offsetRadius={offsetRadius}
        showNavigation={showArrows}
        animationConfig={config.gentle}
      />
    </div>
  );
}
