import React, { useState, useEffect } from "react";
import { View, ImageBackground, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, LogBox, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from "../FirebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { KeyboardAvoidingView } from "react-native";
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfo } from 'react-native';

LogBox.ignoreLogs(['@firebase/auth']);

const windowHeight = Dimensions.get('window').height;
const margenSup = windowHeight * 0.055;
const margenInf = windowHeight * 0.055;

const Login = ({route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      console.log('Entrando al useEffect')
      const { newEmail, newPassword } = route.params || {};
      console.log('newEmail: '+ newEmail)
      console.log('newPassword: '+ newPassword)

      if (newEmail == '' && newPassword == '') {
        console.log('IsFocused')
        Alert.alert('Tu cuenta ah sido borrada')

        setTimeout(() => {
          setEmail(newEmail);
          setPassword(newPassword);
          console.log('Actualizando datos')
        }, 2000);
      }
    }
  }, [isFocused, route.params]);

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
    // Elimina espacios en blanco al inicio y al final del correo electrónico
    const trimmedEmail = email.trim();
    
    // Verifica si el correo electrónico sin espacios al final coincide con el formato válido
    const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    return emailRegex.test(trimmedEmail) && email === trimmedEmail;
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
    //  console.log(response);
      
      if (user.emailVerified) {
        navigation.navigate('Roster', { userEmail: email });
      } else {
        alert('Debes verificar tu correo electrónico antes de iniciar sesión.');
      }
    } catch (error) {
      console.log(error);
      alert('Usuario o contraseña incorrectos, revisa y vuelve a ingresar. ');
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
  
      // Crear el usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
  
      // Enviar correo de verificación
      await sendEmailVerification(userCredential.user);
  
      // Obtén la fecha actual en milisegundos desde la época (por ejemplo, 1697580687908)
      const currentDateMillis = Date.now();
  
      // Calcula la fecha de vencimiento (un mes después de la fecha actual)
      const expirationDateMillis = currentDateMillis + 30 * 24 * 60 * 60 * 1000; // Agregar un mes en milisegundos
  
      // Crear un documento para el usuario en Firestore
      const userDocRef = doc(FIREBASE_FIRESTORE, "users", userCredential.user.uid);
  
      const userData = {
        email,
        createdAt: currentDateMillis, // Almacena la fecha de creación como milisegundos desde la época
        expirationDate: expirationDateMillis, // Almacena la fecha de vencimiento como milisegundos desde la época
      };

      useEffect(() => {
 
        const fetchUserData = async () => {
            const usersCollection = collection(FIREBASE_FIRESTORE, "users");
            const queryByEmail = query(usersCollection, where("email", "==", userEmail));
        
            try {
              const querySnapshot = await getDocs(queryByEmail);
        
              if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                  const userData = doc.data();
                  console.log("Datos del usuario:", userData);
                  const exp = doc.data().expirationDate;
                //  console.log('////////' +fechaCaducidad)
                // console.log('EXP: '+ exp)
                  
                  const timestamp = exp;
                  const fecha = new Date(timestamp);
                  setExp(fecha);
                  console.log("Caduca el *"+ fecha); 
                  setVencimiento(exp)
                  setUserExp(fechaCaducidad)
                });
              } else {
                console.log("No se encontraron datos para el usuario con el correo electrónico:", userEmail);
              }
            } catch (error) {
              console.error("Error al consultar los datos del usuario:", error);
            }       
          };
        
          fetchUserData();
        }, [userEmail]);


      
    //  console.log(new Date(currentDateMillis))
      console.log(new Date(expirationDateMillis))
      

      await setDoc(userDocRef, userData);
  
      alert('Se ha enviado un correo de verificación a tu dirección de correo electrónico. Por favor, verifica tu cuenta.');
    } catch (error) {
      console.log(error);
      alert('Registro fallido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      // Envia un correo para restablecer la contraseña al usuario
      await sendPasswordResetEmail(FIREBASE_AUTH, email);
  
      // Notificar al usuario que se ha enviado un correo para restablecer la contraseña
      alert('Se ha enviado un correo electrónico para restablecer la contraseña. Por favor, verifica tu bandeja de entrada.');
    } catch (error) {
      console.error(error);
      alert('Error al enviar el correo para restablecer la contraseña: ' + error.message);
    }
  };
 
  /////////////////////////////
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
            }}>
            <Text style={Styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        
          <TouchableOpacity
            style={Styles.registerButton}
            onPress={createUser}>
            <Text style={Styles.registerButtonText}>Registrarse</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={Styles.resetButton}
            onPress={resetPassword}>
            <Text style={Styles.registerButtonText}>Olvide mi contraseña</Text>
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
    borderWidth:1,
    backgroundColor: 'blue',
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical:4,
  },
  registerButton: {
    borderWidth:1,
    backgroundColor: 'green', // Cambia el color a tu preferencia
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical:4,

  },
  resetButton: {
    borderWidth:1,
    backgroundColor: '#778899', // Cambia el color a tu preferencia
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical:4,

  },
  borrarCuenta: {
    backgroundColor: 'brown', // Cambia el color a tu preferencia
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical:4,
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
