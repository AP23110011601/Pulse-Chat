import React, { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";

import Animated, {
  Easing,
  Keyframe,
} from "react-native-reanimated";

import { scheduleOnRN } from "react-native-worklets";


const { height } = Dimensions.get("screen");

const INITIAL_SCALE_FACTOR = height / 90;
const DURATION = 600;


// Splash exit animation
const splashKeyframe = new Keyframe({
  0: {
    opacity: 1,
  },

  70: {
    opacity: 0,
    easing: Easing.out(Easing.ease),
  },

  100: {
    opacity: 0,
  },
});


const logoScaleKeyframe = new Keyframe({
  0: {
    transform: [
      {
        scale: INITIAL_SCALE_FACTOR,
      },
    ],
  },

  100: {
    transform: [
      {
        scale: 1,
      },
    ],
    easing: Easing.elastic(0.7),
  },
});


const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [
      {
        scale: 1.3,
      },
    ],
  },

  100: {
    opacity: 1,
    transform: [
      {
        scale: 1,
      },
    ],
    easing: Easing.elastic(0.7),
  },
});


const glowKeyframe = new Keyframe({
  0: {
    transform: [
      {
        rotateZ: "0deg",
      },
    ],
  },

  100: {
    transform: [
      {
        rotateZ: "720deg",
      },
    ],
  },
});


export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);


  if (!visible) return null;


  const image = (
    <Image
      style={styles.image}
      source={require("@/assets/images/expo-logo.png")}
    />
  );


  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback(
        (finished) => {
          "worklet";

          if (finished) {
            scheduleOnRN(setVisible, false);
          }
        }
      )}
      style={styles.overlay}
    >
      {image}
    </Animated.View>
  ) : (
    <View
      style={styles.overlay}
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
    >
      {image}
    </View>
  );
}



export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>

      <Animated.View
        entering={glowKeyframe.duration(4000)}
        style={styles.glowContainer}
      >
        <Image
          style={styles.glow}
          source={require("@/assets/images/logo-glow.png")}
        />
      </Animated.View>


      <Animated.View
        entering={logoScaleKeyframe.duration(DURATION)}
        style={styles.background}
      />


      <Animated.View
        entering={logoKeyframe.duration(DURATION)}
        style={styles.imageContainer}
      >
        <Image
          style={styles.image}
          source={require("@/assets/images/expo-logo.png")}
        />
      </Animated.View>

    </View>
  );
}



const styles = StyleSheet.create({

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#208AEF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },


  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },


  image: {
    width: 76,
    height: 71,
  },


  iconContainer: {
    width: 128,
    height: 128,
    justifyContent: "center",
    alignItems: "center",
  },


  glowContainer: {
    position: "absolute",
  },


  glow: {
    width: 201,
    height: 201,
  },


  background: {
    width: 128,
    height: 128,
    borderRadius: 40,
    backgroundColor: "#0274DF",
    position: "absolute",
  },

});