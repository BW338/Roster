import React, { useState, useEffect } from "react";
import { View, ImageBackground, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, LogBox, Alert, Modal} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from "../FirebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { KeyboardAvoidingView } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { doc,setDoc, getDoc, collection, query, where, getDocs,updateDoc  } from "firebase/firestore";

LogBox.ignoreLogs(['@firebase/auth']);

const windowHeight = Dimensions.get('window').height;
const margenSup = windowHeight * 0.055;
const margenInf = windowHeight * 0.055;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(false); 

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
  
      if (user.emailVerified) {
        // Obtener datos adicionales del usuario desde Firestore
        const userDocRef = doc(FIREBASE_FIRESTORE, 'users', user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
  
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          console.log('userData:', userData);
  
          if (userData.cancelado) {
            // Usuario cancelado, muestra un alert
            /*  
            alert('Tu suscripción ha sido cancelada. Por favor, contacta al soporte para más información.');
*/
            console.log('Antes de avisoUsuarioBorrado');
            avisoUsuarioBorrado();
            console.log('Después de avisoUsuarioBorrado'); 

          } else {
            // Usuario no cancelado, navega a Roster
            console.log('Navegando a Roster.js');
            navigation.navigate('Roster', { userEmail: email });
          }
        } else {
          console.log('No se encontraron datos adicionales para el usuario.');
        }
      } else {
        alert('Debes verificar tu correo electrónico antes de iniciar sesión.');
      }
    } catch (error) {
      console.log(error);
      alert('Usuario o contraseña incorrectos, revisa y vuelve a ingresar.');
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
        cancelado: false, //Anulacion de suscripcion
      };
      
      console.log(new Date(currentDateMillis))
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
      // Obtener datos adicionales del usuario desde Firestore
      const user = auth.currentUser;
      if (!user) {
        console.log('No hay usuario autenticado.');
        return;
      }
  
      const userDocRef = doc(FIREBASE_FIRESTORE, 'users', user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
  
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        console.log('userData:', userData);
  
        if (userData.cancelado) {
          // Usuario cancelado, muestra un alert
          avisoUsuarioBorrado();
          console.log('Usuario cancelado. No se puede restablecer la contraseña.');
        } else {
          // Usuario no cancelado, enviar correo para restablecer la contraseña
          await sendPasswordResetEmail(auth, user.email);
          alert('Se ha enviado un correo electrónico para restablecer la contraseña. Por favor, verifica tu bandeja de entrada.');
        }
      } else {
        console.log('No se encontraron datos adicionales para el usuario.');
      }
    } catch (error) {
      console.error(error);
      alert('Error al verificar el usuario antes de restablecer la contraseña: ' + error.message);
    }
  };
  

  const avisoUsuarioBorrado = () => {
    Alert.alert(
      'Usuario borrado',
      'Este usuario ah sido borrado, si quiere volverlo a activar preciona activar, de lo contrario preciona cerrar',
      [
        {
          text: 'Activar',
      //FUNCION PARA REACTIVAR USUARIO////
          onPress: async () => {
            try {
              // Verifica si el usuario está autenticado
              if (auth.currentUser) {
                const user = auth.currentUser;
          
                // Aquí necesitas la referencia al documento del usuario
                const userDocRef = doc(FIREBASE_FIRESTORE, 'users', user.uid);
          
                // Actualiza el campo cancelado a false
                await updateDoc(userDocRef, {
                  cancelado: false,
                });
                Alert.alert('Tu usuario ah sido activado, ya podes iniciar sesion!')
                console.log('Usuario activado correctamente.');
              } else {
                console.error('Usuario no autenticado.');
              }
            } catch (error) {
              console.error('Error al activar el usuario:', error);
            }
          },
        },
      ////-----------------------------------------------  
        {
          text: 'Cerrar',
          onPress: () => {
            console.log('Se presionó "Cerrar"');
          },
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
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
    backgroundColor: 'blue',
    paddingVertical: 10,
    borderRadius: 5,
  },
  registerButton: {
    backgroundColor: 'green', // Cambia el color a tu preferencia
    paddingVertical: 10,
    borderRadius: 5,
  },
  resetButton: {
    backgroundColor: 'brown', // Cambia el color a tu preferencia
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
