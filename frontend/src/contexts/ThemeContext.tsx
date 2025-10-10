import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import { THEME_MODE_KEY, THEME_COLORS } from '../config';
interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY);
    return (savedMode as 'light' | 'dark') || 'light';
  });

  const [primaryColor, setPrimaryColor] = useState(THEME_COLORS.primary);
  const [secondaryColor, setSecondaryColor] = useState(THEME_COLORS.secondary);

  useEffect(() => {
    localStorage.setItem(THEME_MODE_KEY, mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const customTheme = {
    ...theme,
    palette: {
      ...theme.palette,
      mode,
      primary: {
        ...theme.palette.primary,
        main: primaryColor,
      },
      secondary: {
        ...theme.palette.secondary,
        main: secondaryColor,
      },
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleTheme,
        primaryColor,
        secondaryColor,
        setPrimaryColor,
        setSecondaryColor,
      }}
    >
      <MuiThemeProvider theme={customTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 