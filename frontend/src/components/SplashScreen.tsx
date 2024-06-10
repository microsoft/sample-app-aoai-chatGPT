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
            <Spinner size={SpinnerSize.large} styles={{
                label: {
                    color: 'white'
                }
            }} label={loadingText} />
        </div>
    );
};

export default SplashScreen;
