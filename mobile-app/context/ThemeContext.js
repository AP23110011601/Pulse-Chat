import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme } from "../constants/theme";


const ThemeContext = createContext(null);


export function ThemeProvider({ children }) {

  const [themeMode, setThemeMode] = useState("dark");


  useEffect(() => {

    const loadTheme = async () => {

      try {

        const savedTheme =
          await AsyncStorage.getItem("pulse_theme_mode");


        if (
          savedTheme === "light" ||
          savedTheme === "dark"
        ) {

          setThemeMode(savedTheme);

        }


      } catch (error) {

        console.log(
          "Theme loading error:",
          error
        );

      }

    };


    loadTheme();

  }, []);



  const toggleTheme = async () => {

    const nextMode =
      themeMode === "dark"
        ? "light"
        : "dark";


    setThemeMode(nextMode);


    try {

      await AsyncStorage.setItem(
        "pulse_theme_mode",
        nextMode
      );


    } catch (error) {

      console.log(
        "Theme save error:",
        error
      );

    }

  };



  


  // Prevent app crash if theme is missing
 const theme = Theme?.[themeMode] || {
  background: "#000000",
  primary: "#ffffff",
  text: "#ffffff",
};


  return (

    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        toggleTheme,
      }}
    >

      {children}

    </ThemeContext.Provider>

  );

}



export function useTheme() {

  const context =
    useContext(ThemeContext);


  if (!context) {

    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );

  }


  return context;

}