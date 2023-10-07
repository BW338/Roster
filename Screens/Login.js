import React, { useState, useEffect } from "react";
import { View, ImageBackground, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_AUTH } from "../FirebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { KeyboardAvoidingView } from "react-native";
import { collection, getFirestore, doc, getDoc } from 'firebase/firestore'; // Importa las funciones necesarias
import { useNavigation } from '@react-navigation/native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;

  

  useEffect(() => {
    // Leer datos desde AsyncStorage al cargar el componente
    const fetchData = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('email');
        if (savedEmail !== null) {
          setEmail(savedEmail);
        }const savedPassword = await AsyncStorage.getItem('password');
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
    // Expresión regular para validar el formato de correo electrónico
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
      // Aquí puedes manejar la redirección o cualquier otra lógica después del inicio de sesión exitoso.
    //  alert('Inicio de sesión exitoso');
    //  console.log('CAMBIANDO A ROSTER...')
      navigation.navigate('Roster');
    } catch (error) {
      console.log(error);
      // Aquí puedes manejar errores, como mostrar un mensaje de error al usuario.
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

      // Aquí debes usar la función correspondiente para crear un nuevo usuario en Firebase.
      // Por ejemplo:
      const response = await createUserWithEmailAndPassword(auth, email, password);
      // Después de crear el usuario, puedes realizar cualquier lógica adicional que necesites.
      // Por ejemplo, almacenar información adicional en Firestore o mostrar un mensaje de registro exitoso.
      console.log(response); // Puedes imprimir la respuesta de Firebase para verificar si el usuario se creó correctamente.
      alert('Registro exitoso');
    } catch (error) {
      console.log(error);
      // Aquí puedes manejar errores, como mostrar un mensaje de error al usuario.
      alert('Registro fallido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    // Verifica que ambos campos estén completos y válidos
    if (isEmailValid(email) && password.length >= 6) {
      // Realiza el inicio de sesión automáticamente
      signIn();
    }
  }, [email, password]);

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
          onPress={()=>{
                       signIn();
                       saveData();}}
        >
          <Text style={Styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={Styles.registerButton} // Cambia el nombre de la variable para reflejar "Registrarse"
          onPress={createUser}
        >
          <Text style={Styles.registerButtonText}>Registrarse</Text>
        </TouchableOpacity>
        
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const Styles = StyleSheet.create({
  fondo: {
    marginTop:'6%',
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
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
