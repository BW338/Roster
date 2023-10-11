import React, { useState, useEffect } from "react";
import { View, ImageBackground, TouchableOpacity, TouchableNativeFeedback, Animated, Dimensions, StyleSheet,TextInput } from 'react-native';
import { SimpleLineIcons } from '@expo/vector-icons';
import { FIREBASE_AUTH } from "../FirebaseConfig";
import Login from "./Login";

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
    <ImageBackground source={require('../assets/roster.jpg')} style={Styles.fondo}>
      
     
      <View style={{ flex: 1,
                     justifyContent: 'flex-end',
                     marginBottom:10,
                     alignItems: 'center',
                      }}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableNativeFeedback>
            <SimpleLineIcons name="plane" size={28} color="white"
              title='Ingresar'
              background={TouchableNativeFeedback.Ripple('#ffffff', false)}
              onPress={Ingresar}
            />
          </TouchableNativeFeedback>
        </Animated.View>
        <TouchableOpacity onPress={Ingresar}>
          <Animated.Text style={{ color: 'white', fontSize: 24, opacity: fadeAnim }}>Ingresar</Animated.Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const Styles = StyleSheet.create({
    fondo: {
        //borderWidth:2,
        //borderColor:"red",
        flex:1,
        marginTop:margenSup,
        resizeMode:'cover',
        justifyContent:'center',
        alignItems:'center',
        
      },
      inputs:{
        color:'white',
        fontSize:24,
        textAlign:'center',
        
      }
})