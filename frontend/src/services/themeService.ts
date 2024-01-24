// Create a theme service to handle the theme of the application using fluent 2

import { Theme, teamsDarkTheme, teamsLightTheme, webDarkTheme, webLightTheme, teamsHighContrastTheme } from "@fluentui/react-components";

export default class ThemeService {
    public getTheme(): Theme {
        return this.getThemeByNumber(this.getUrlParameterThemeNumber());
    }

    private getThemeByNumber(themeNumber: number): Theme {
        switch (themeNumber) {
            case 0:
                return webLightTheme;
            case 1:
                return webDarkTheme;
            case 2:
                return teamsLightTheme;
            case 3:
                return teamsDarkTheme;
            case 4:
                return teamsHighContrastTheme;
            default:
                return webLightTheme;
        }
    }

    getUrlParameterThemeNumber(): number {
        const urlParams = new URLSearchParams(window.location.search);
        const themeNumber = urlParams.get('theme');
        return themeNumber ? parseInt(themeNumber) : 0;
    }

};
