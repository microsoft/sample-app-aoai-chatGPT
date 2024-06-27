import React from 'react';
import { PrimaryButton } from '@fluentui/react';
import style from "../ProductInformation/ProductInfo.module.css";

interface CustomButtonProps {
    disabled: boolean;
    onClick: () => void;
    label: string;
    width?: string;
    backgroundColor?:string
}

const PrimaryButtonComponent: React.FC<CustomButtonProps> = ({ disabled=false, onClick, label ,width="100%",backgroundColor="black"}) => {
    
    return (
        <PrimaryButton
            styles={{
                root: {
                    width: width,
                    background :backgroundColor,
                    boxShadow: 'none',
                    border: '0px solid black !important',
                    selectors: {
                        ':hover': {
                            background: 'black !important',
                            border: "none !important"
                        },
                        ':active': {
                            background: '#202a2f',
                            border: "none !important"
                        },
                        ':focus': {
                            background: 'transparent',
                            border: "none !important"
                        }
                    }
                }
            }}
            className={style.button}
            disabled={disabled}
            onClick={onClick}
        >
            {label}
        </PrimaryButton>
    );
};

export default PrimaryButtonComponent;
