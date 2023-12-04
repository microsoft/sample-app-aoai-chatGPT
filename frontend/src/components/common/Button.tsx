import { CommandBarButton, DefaultButton, IButtonProps, IButtonStyles, ICommandBarStyles } from "@fluentui/react";
import React, { useState, useEffect } from 'react';

interface ShareButtonProps extends IButtonProps {
    onClick: () => void;
  }
export const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const shareButtonStyles: ICommandBarStyles & IButtonStyles = {
      root: {
        width: isMobile ? 25 : 150,
        height: 38,
        borderRadius: 4,
        background: '#fbbb00',
      //   position: 'absolute',
      //   right: 20,
        padding: '5px 12px',
        marginRight: '20px'
      },
      icon: {
        color: '#FFFFFF',
       
      },
      rootHovered: {
        background: '#f7cd4f',
      },
      label: {
        fontWeight: 600,
        fontSize: 14,
        lineHeight: '20px',
        color: '#FFFFFF',
        display: isMobile ? 'none' : 'inline',
      },
    };

    return (
        <CommandBarButton
            styles={shareButtonStyles}
            iconProps={{ iconName: 'Share' }}
            onClick={onClick}
            text={isMobile ? '' : 'Compartilhar'}
        />
    );
};

interface HistoryButtonProps extends IButtonProps {
    onClick: () => void;
    text: string;
  }

export const HistoryButton: React.FC<HistoryButtonProps> = ({onClick, text}) => {

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    const historyButtonStyles: ICommandBarStyles & IButtonStyles = {
        root: {
            width: isMobile ? 25 : 180,
            height: '38px',
            border: `1px solid #D1D1D1`,
          },
          rootHovered: {
            border: `1px solid #D1D1D1`,
          },
          rootPressed: {
            border: `1px solid #D1D1D1`,
          },
      };

      return (
        <DefaultButton
            text={text}
            iconProps={{ iconName: 'History' }}
            onClick={onClick}
            styles={historyButtonStyles}
        />
      )
}