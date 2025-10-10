import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, { createContext, useContext, useMemo, useState } from 'react';

interface ColorModeContextProps {
    mode: 'light' | 'dark';
    toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextProps>({ mode: 'light', toggleColorMode: () => { } });

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<'light' | 'dark'>(() => {
        const stored = localStorage.getItem('themeMode');
        return stored === 'dark' ? 'dark' : 'light';
    });

    const colorMode = React.useMemo(() => ({
        mode,
        toggleColorMode: () => {
            setMode((prev) => {
                const next = prev === 'light' ? 'dark' : 'light';
                localStorage.setItem('themeMode', next);
                return next;
            });
        }
    }), [mode]);

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: '#0066CC'
            },
            secondary: {
                main: '#0094FF'
            },
            background: {
                default: mode === 'dark' ? '#121212' : '#F7F9FA',
                paper: mode === 'dark' ? '#1d1d1d' : '#ffffff'
            }
        },
        typography: {
            fontFamily: 'Inter, Roboto, sans-serif'
        },
        shape: {
            borderRadius: 8
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        margin: 0,
                        padding: 0,
                        overflow: 'hidden'
                    },
                    html: {
                        margin: 0,
                        padding: 0
                    }
                }
            }
        }
    }), [mode]);

    React.useEffect(() => {
        const bg = mode === 'dark' ? '#121212' : '#f5f5f5';
        document.body.style.backgroundColor = bg;
        document.body.style.color = mode === 'dark' ? '#ffffff' : '#000000';
        document.documentElement.classList.toggle('dark', mode === 'dark');
    }, [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}; 