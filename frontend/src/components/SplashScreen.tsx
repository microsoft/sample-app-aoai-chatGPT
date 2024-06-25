import React, { useEffect } from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import './SplashScreen.css';

interface SplashScreenProps {
    logo: string;
    loadingText?: string;
    duration: number;
    onTimeout: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ logo, loadingText = '', duration, onTimeout }) => {
    useEffect(() => {
        const timer = setTimeout(onTimeout, duration);
        return () => clearTimeout(timer);
    }, [duration, onTimeout]);

    return (
        <div className="splash-screen">
            <img src={logo} alt="Logo" className="logo" />
            {/* <Spinner size={SpinnerSize.large} styles={{
                label: {
                    color: 'white'
                },
                circle: {
                    '@media (max-width: 1000px)': {
                        height: 25, width: 25
                    },
                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                        height: 60, width: 60
                    },
                }
            }} label={loadingText} /> */}
        </div>
    );
};

export default SplashScreen;
