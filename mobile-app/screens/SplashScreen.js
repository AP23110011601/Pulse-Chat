import React from "react";
import {
 View,
 Text,
 ActivityIndicator,
 StyleSheet
} from "react-native";

import { useTheme } from "../context/ThemeContext";


export default function SplashScreen(){

const {theme}=useTheme();


return(
<View style={[
styles.container,
{backgroundColor:theme.background}
]}>

<Text style={[
styles.logo,
{color:theme.primary}
]}>
⚡ PULSE
</Text>


<Text style={[
styles.text,
{color:theme.text}
]}>
Loading...
</Text>


<ActivityIndicator
size="large"
color={theme.primary}
/>


</View>
)

}


const styles=StyleSheet.create({

container:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

logo:{
fontSize:40,
fontWeight:"900"
},

text:{
marginTop:20,
fontSize:16
}

});