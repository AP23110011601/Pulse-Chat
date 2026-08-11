import React, { useState } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

import { AnimatedSplashOverlay } from "./components/AnimatedSplashOverlay";

import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import ChatScreen from "./screens/ChatScreen";
import GroupChatScreen from "./screens/GroupChatScreen";
import ProfileScreen from "./screens/ProfileScreen";
import CreateGroupScreen from "./screens/CreateGroupScreen";
import GroupInfoScreen from "./screens/GroupInfoScreen";
import AdminScreen from "./screens/AdminScreen";


const Stack = createNativeStackNavigator();


function RootNavigator() {

  const { isAuthenticated, loading } = useAuth();

  const { theme, themeMode } = useTheme();


  if (loading) {
    console.log("APP IS STILL LOADING");

    return <SplashScreen />;
  }


  const navTheme = {

    dark: themeMode === "dark",

    colors: {

      primary: theme.primary,

      background: theme.background,

      card: theme.surface,

      text: theme.text,

      border: theme.cardBorder,

      notification: theme.primary,

    },


    fonts: {

      regular: {
        fontFamily: "System",
        fontWeight: "400",
      },

      medium: {
        fontFamily: "System",
        fontWeight: "500",
      },

      bold: {
        fontFamily: "System",
        fontWeight: "700",
      },

      heavy: {
        fontFamily: "System",
        fontWeight: "800",
      },

    },

  };


  return (

    <NavigationContainer theme={navTheme}>

      <StatusBar
        style={
          themeMode === "dark"
            ? "light"
            : "dark"
        }
      />


      <Stack.Navigator

        screenOptions={{

          headerStyle: {

            backgroundColor: theme.surface,

          },


          headerTintColor: theme.text,


          headerTitleStyle: {

            fontWeight: "800",

          },


          contentStyle: {

            backgroundColor: theme.background,

          },


        }}

      >


        {
          isAuthenticated ? (

            <>

              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  headerShown:false,
                }}
              />


              <Stack.Screen
                name="Chat"
                component={ChatScreen}
              />


              <Stack.Screen
                name="GroupChat"
                component={GroupChatScreen}
              />


              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  title:"Profile",
                }}
              />


              <Stack.Screen
                name="CreateGroup"
                component={CreateGroupScreen}
                options={{
                  title:"New Group",
                }}
              />


              <Stack.Screen
                name="GroupInfo"
                component={GroupInfoScreen}
                options={{
                  title:"Group Info",
                }}
              />


              <Stack.Screen
                name="Admin"
                component={AdminScreen}
                options={{
                  title:"Admin Portal",
                }}
              />


            </>


          ) : (

            <>


              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                  headerShown:false,
                }}
              />


              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                  title:"Create Account",
                }}
              />


            </>

          )

        }


      </Stack.Navigator>


    </NavigationContainer>

  );

}




export default function App() {


  const [showSplash, setShowSplash] = useState(true);



  return (

    <ThemeProvider>

      <AuthProvider>


        {
          showSplash && (

            <AnimatedSplashOverlay

              onFinish={() => {

                setShowSplash(false);

              }}

            />

          )
        }


        <RootNavigator />


      </AuthProvider>

    </ThemeProvider>


  );

}