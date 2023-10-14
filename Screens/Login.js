import React, { useState, useEffect } from "react";
import { View, ImageBackground, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_AUTH } from "../FirebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import { KeyboardAvoidingView } from "react-native";
import { collection, addDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const windowHeight = Dimensions.get('window').height;
const margenSup = windowHeight * 0.055;
const margenInf = windowHeight * 0.055;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('email');
        if (savedEmail !== null) {
          setEmail(savedEmail);
        }
        const savedPassword = await AsyncStorage.getItem('password');
        if (savedPassword !== null) {
          setPassword(savedPassword);
        }
      } catch (error) {
        console.error('Error al leer datos desde AsyncStorage:', error);
      }
    };

    fetchData();
  }, []);

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('password', password);
    } catch (error) {
      console.error('Error al guardar datos en AsyncStorage:', error);
    }
  };

  const isEmailValid = (email) => {
    const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    return emailRegex.test(email);
  };

  const navigation = useNavigation();

  const signIn = async () => {
    setLoading(true);
    try {
      if (!isEmailValid(email)) {
        alert('Correo electrónico no válido');
        setLoading(false);
        return;
      }

      const response = await signInWithEmailAndPassword(auth, email, password);
      const user = response.user;
      console.log(response);
      
      if (user.emailVerified) {
        navigation.navigate('Roster');
      } else {
        alert('Debes verificar tu correo electrónico antes de iniciar sesión.');
      }
    } catch (error) {
      console.log(error);
      alert('Usuario o contraseña incorrectos, revisa y vuelve a ingresar. ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setLoading(true);
    try {
      if (!isEmailValid(email)) {
        alert('Correo electrónico no válido');
        setLoading(false);
        return;
      }
  
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await sendEmailVerification(userCredential.user);
  
      alert('Se ha enviado un correo de verificación a tu dirección de correo electrónico. Por favor, verifica tu cuenta.');
    } catch (error) {
      console.log(error);
      alert('Registro fallido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/login.jpg')} style={Styles.fondo}>
      <View style={Styles.container}>
        <KeyboardAvoidingView behavior="padding">
          <TextInput
            style={Styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={Styles.input}
            placeholder="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={Styles.loginButton}
            onPress={() => {
              signIn();
              saveData();
            }}
          >
            <Text style={Styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={Styles.registerButton}
            onPress={createUser}
          >
            <Text style={Styles.registerButtonText}>Registrarse</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
};



const Styles = StyleSheet.create({
  fondo: {
    marginTop:margenSup,
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    marginBottom:margenInf,
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 10,

  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  loginButton: {
    backgroundColor: 'blue',
    paddingVertical: 10,
    borderRadius: 5,
  },
  registerButton: {
    backgroundColor: 'green', // Cambia el color a tu preferencia
    paddingVertical: 10,
    borderRadius: 5,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  registerButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default Login;
