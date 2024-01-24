import { Theme, teamsDarkTheme, teamsLightTheme, webDarkTheme, webLightTheme, teamsHighContrastTheme } from "@fluentui/react-components";

export default class ThemeService {
    public getTheme(theme?: string ): Theme {

        let themeNumber = this.getUrlParameterThemeNumber();
        
        if (themeNumber !== undefined) {
            return this.getThemeByNumber(themeNumber);
        }

        if (theme) {
            switch (theme) {
                case "dark":
                    return teamsDarkTheme;
                case "light":
                    return teamsLightTheme;
                case "webDark":
                    return webDarkTheme;
                case "webLight":
                    return webLightTheme;
                case "hc":
                    return teamsHighContrastTheme;
                default:
                    return webLightTheme;
            }
        }

        return webLightTheme;
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

    public getUrlParameterThemeNumber(): number | undefined {
        const urlParams = new URLSearchParams(window.location.search);
        const themeNumber = urlParams.get('theme');
        return themeNumber ? parseInt(themeNumber) : undefined;
    }

};
