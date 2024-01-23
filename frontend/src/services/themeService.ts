// Create a theme service to handle the theme of the application using fluent 2

import { Theme, webDarkTheme, webLightTheme } from "@fluentui/react-components";

export default class ThemeService {
    public getTheme(darkMode?: boolean): Theme {
        return darkMode ? webDarkTheme : webLightTheme;
    }
};
