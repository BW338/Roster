import React, { useState, useEffect } from "react";
import { View, ImageBackground, TouchableOpacity, TouchableWithoutFeedback, Animated, Dimensions, StyleSheet, TouchableNativeFeedback } from 'react-native';
import { Fontisto } from '@expo/vector-icons';

const windowHeight = Dimensions.get('window').height;
const margenSup = windowHeight * 0.055; // Ajusta el margen superior porcentualmente

export default function Splash({ navigation }) {
  const [fadeAnim] = useState(new Animated.Value(0));

  const Ingresar = () => {
    navigation.navigate('Roster');
  }

  useEffect(() => {
    Animated.timing(
      fadeAnim,
      {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }
    ).start();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Ingresar}>
      <ImageBackground source={require('../assets/R-splash6.jpg')} style={Styles.fondo}>
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
          marginBottom: 10,
          alignItems: 'center',
          borderBottomRightRadius: 80,
        }}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableNativeFeedback>
              <Fontisto name="cloudflare" size={120} color="white" style={{ paddingVertical: 0, alignSelf: 'center', marginTop: 3 }}
                title='Ingresar'
                background={TouchableNativeFeedback.Ripple('#ffffff', false)}
                onPress={Ingresar}
              />
            </TouchableNativeFeedback>
          </Animated.View>
          <TouchableOpacity onPress={Ingresar}>
            <Animated.Text style={{ color: 'white', fontSize: 32, opacity: fadeAnim }}>Ingresar</Animated.Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const Styles = StyleSheet.create({
  fondo: {
    //borderWidth:2,
    //borderColor:"red",
    flex: 1,
    marginTop: margenSup,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputs: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  }
})