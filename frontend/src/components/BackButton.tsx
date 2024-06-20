import React from 'react';
import { Icon, IIconProps } from '@fluentui/react';
 
interface BackButtonProps {
    onClick: () => void;
}
const iconStyles: IIconProps = {
    iconName: 'Back',
    styles: {
        root: {
            marginRight:20,
            marginTop:4,
            fontWeight: "bold", fontSize: "24px",
 
            // '@media (max-width: 599px)': {
            //     fontWeight: "bold", fontSize: "18px",
            // },
            // '@media (max-width: 1000px) and (min-width: 600px)': {
            //     fontWeight: "bold", fontSize: "28px",
            // },
            // '@media (max-width: 1500px) and (min-width: 1000px)': {
            //     fontWeight: "bold", fontSize: "28px",
            // },
            // '@media (max-width: 2500px) and (min-width: 1500px)': {
            //     fontSize:"28px",
 
            // },
            color: '#FFFFFF',
            cursor: 'pointer',
        },
    },
};
const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
    return (
            <Icon {...iconStyles} onClick={onClick}/>
    );
};
 
export default BackButton;