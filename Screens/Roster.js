import React, { useState, useEffect, useRef } from 'react';
import { StatusBar  as ExpoStatusBar } from 'expo-status-bar';
import { View, TextInput, Button, Alert, Modal, Text, ScrollView, Dimensions, ToastAndroid, Platform,
         TouchableOpacity,StyleSheet,Image, useFocusEffect , StatusBar} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomCheckBox from '../Routes/Components/Checkbox';
import 'react-native-get-random-values';
import { WebView } from 'react-native-webview';
import cheerio from 'cheerio';
import { useNavigation, useIsFocused  } from '@react-navigation/native';
import { Fontisto, FontAwesome, FontAwesome5, MaterialIcons, Ionicons, Feather, MaterialCommunityIcons  } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from "../FirebaseConfig"; // Asegúrate de importar el objeto auth de Firebase adecuadamente
import { doc, getDoc, collection, query, where, getDocs,updateDoc  } from "firebase/firestore";
import { openBrowserAsync } from "expo-web-browser";
import { handleIntegrationMP } from '../MP/preference'; // Importa el módulo



const currentDate = new Date(); // Obtiene la fecha actual

const windowHeight = Dimensions.get('window').height;
const margenSup = windowHeight * 0.055; // Ajusta el margen superior porcentualmente

export default function Roster({ route }) {
 
 
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [clave, setClave] = useState('');
  const webViewRef = useRef(null);
  const [showModal, setShowModal] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [userDataModal, setUserDataModal] = useState(false);
  const [borrar, setBorrar] = useState(false);
  const [userEXP, setUserExp] = useState('');
  const [exp, setExp] = useState('Sin datos');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [rosterData, setRosterData] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberData, setRememberData] = useState(false);
  const { userEmail } = route.params || { userEmail: 'valor_predeterminado' };
  const navigation = useNavigation();
  const hoy = Date.now();
  const [vencimiento, setVencimiento] = useState('');
  const [esVigente, setEsVigente] = useState(false);

  const expFecha = new Date(vencimiento);
  const diaExp = expFecha.getDate();
  const mesExp = expFecha.getMonth() + 1; // Los meses en JavaScript comienzan en 0, por lo que sumamos 1
  const anioExp = expFecha.getFullYear();
  const fechaCaducidad = `${diaExp}/${mesExp}/${anioExp}`;
  const [vencido, setVencido] = useState(fechaCaducidad);

  const hoyFecha = new Date(hoy);
  const diaHoy = hoyFecha.getDate();
  const mesHoy = hoyFecha.getMonth() + 1; // Los meses en JavaScript comienzan en 0, por lo que sumamos 1
  const anioHoy = hoyFecha.getFullYear();
  const fechaInicio = `${diaHoy} / ${mesHoy} / ${anioHoy}`;


////abre el Roster cuando se viene del boton ver Roster de Login.js/////  
  useEffect(() => {
    // Verifica si showModalIdentifier se proporcionó en las propiedades de navegación
    if (route.params?.showModalIdentifier) {
      const identifier = route.params.showModalIdentifier;
      // Realiza acciones específicas según la identificación
      if (identifier === 'verRoster') {
        setShowModal(true);
      }
      // Restablece la identificación en las propiedades de navegación para que no se vuelva a usar
      navigation.setParams({ showModalIdentifier: null });
    }
  }, [route.params, navigation]);
/////////////////////////////////////////////
const HEROKU_SERVER_URL = 'https://stormy-taiga-82317-47575a2d66a9.herokuapp.com'; // Reemplaza con la URL de tu servidor de Heroku

const handleBuy = async () => {
  try {
    const { init_point, preference_id } = await handleIntegrationMP();

    if (!init_point || !preference_id) {
      return console.log('--ERROR--');
    }

    const paymentURL = `${HEROKU_SERVER_URL}/webhook-mercadopago`;

    openBrowserAsync(init_point, paymentURL)
      .then(() => {
        let pollingInterval = setInterval(async () => {
          try {
            const paymentData = await obtenerIDPagoAprobado();

            if (paymentData && paymentData.id) {
              idpago = paymentData.id; // Actualiza idpago con el nuevo ID del pago aprobado
              clearInterval(pollingInterval);
            }
          } catch (error) {
            clearInterval(pollingInterval);
          //  console.error('Error during payment polling:', error);
          }
        }, 5000); // Intervalo de sondeo en milisegundos (5 segundos en este ejemplo)
        
        navigation.navigate('Login')

      })
      .catch(error => console.error('Error opening the browser:', error));
  } catch (error) {
    console.error('Error starting the purchase process:', error);
  }
  setModalVisible(false)
};

const handleCheckboxChange = (newValue) => {
  setCheckboxValue(newValue);
};

const borrarCuenta = async () => {
  
  console.log('********'+ userEmail)
  const usersCollection = collection(FIREBASE_FIRESTORE, "users");
  const queryByEmail = query(usersCollection, where("email", "==", userEmail));

  setUsername('');
  setClave('');
  userEmail== ''

  setBorrar(false)
  setUserDataModal(false)


  try {
    const querySnapshot = await getDocs(queryByEmail);

    const ahora = new Date(); // Fecha y hora actual
    const hace24Horas = ahora.getTime() - 24 * 60 * 60 * 1000; // Resta 24 horas en milisegundos
    const expirationDate = hace24Horas;

    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (doc) => {
        const docRef = doc.ref; // Utiliza doc.ref para obtener la referencia del documento
        await updateDoc(docRef, {
          expirationDate: expirationDate,
          cancelado : true
          
        });
        console.log("Suscripción cancelada para el usuario con correo electrónico:", userEmail);
      });
    
    } else {
      console.log("*No se encontraron datos para el usuario con el correo electrónico:", userEmail);
    }
  } catch (error) {
    console.error("Error al cancelar la suscripción del usuario:", error);
  }
  navigation.navigate('Login', { newEmail: '', newPassword: '' });

};  

const fetchUserData = async () => {
  const routeParams = route.params || {}; // Asegúrate de que route.params no sea nulo
  const isFromSignIn = routeParams.fromSignIn || false;

  // Verifica si la función debe ejecutarse solo si viene de signIn
  if (!isFromSignIn) {
    return;
  }

  const usersCollection = collection(FIREBASE_FIRESTORE, "users");
  const queryByEmail = query(usersCollection, where("email", "==", userEmail));

  try {
    const querySnapshot = await getDocs(queryByEmail);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log("Datos del usuario:", userData);
        const exp = doc.data().expirationDate;
        
        const timestamp = exp;
        const fecha = new Date(timestamp);

        setExp(fecha);

        console.log("Caduca el *"+ fecha); 
        
        setVencimiento(exp)
        setVencido(fechaCaducidad);

        // Actualizar esVigente después de obtener los datos
        const hoy = Date.now();
        const vigente = exp > hoy;
        setEsVigente(vigente);
      });
    } else {
      console.log("No se encontraron datos para el usuario con el correo electrónico:", userEmail);
    }
  } catch (error) {
    console.error("Error al consultar los datos del usuario:", error);
  }       
};


const ejecutarFuncionX = async () => {
  // Lógica de tu función
  const routeParams = route.params || {}; // Asegúrate de que route.params no sea nulo
  const isFromSignIn = routeParams.fromSignIn || false;

  // Verifica si la función debe ejecutarse solo si viene de signIn
  if (!isFromSignIn) {
    return;
  }

  const usersCollection = collection(FIREBASE_FIRESTORE, "users");
  const queryByEmail = query(usersCollection, where("email", "==", userEmail));

  try {
    const querySnapshot = await getDocs(queryByEmail);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log("Datos del usuario:", userData);
        const exp = doc.data().expirationDate;
        
        const timestamp = exp;
        const fecha = new Date(timestamp);

        setExp(fecha);

        console.log("Caduca el *"+ fecha); 
        
        setVencimiento(exp)
        setVencido(fechaCaducidad);

        // Actualizar esVigente después de obtener los datos
        const hoy = Date.now();
        const vigente = exp > hoy;
        setEsVigente(vigente);
      });
    } else {
      console.log("No se encontraron datos para el usuario con el correo electrónico:", userEmail);
    }
  } catch (error) {
    console.error("Error al consultar los datos del usuario:", error);
  }     
  // Llamada a fetchUserData
  await fetchUserData();
}; 


useEffect(() => {
  // Llamada inicial a fetchUserData al montar el componente
ejecutarFuncionX();
}, [userEmail]);


useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
      ejecutarFuncionX();
    });

    ejecutarFuncionX(); // Ejecutar la función x al montar la pantalla

    return unsubscribe;
  }, [navigation]);
/////////
useEffect(() => {
  // Recupera el estado del CheckBox desde AsyncStorage
const getRememberDataSetting = async () => {
    try {
      const storedRememberData = await AsyncStorage.getItem('rememberData');
      // Si se encuentra un valor en AsyncStorage, convierte a booleano
      if (storedRememberData !== null) {
        setRememberData(JSON.parse(storedRememberData));
      } else {
        // Valor predeterminado si no se encuentra ningún valor en AsyncStorage
        setRememberData(false);
      }
    } catch (error) {
      console.error('Error al recuperar el estado del CheckBox:', error);
    }
  };

  getRememberDataSetting();
}, []);

const toggleCrewVisibility = (flightIndex, date) => {
    if (selectedFlight && selectedFlight.index === flightIndex && selectedFlight.date === date) {
      // Si ya está abierto, cierra la tripulación
      setSelectedFlight(null);
    } else {
      // Si no está abierto, ábrelo
      setSelectedFlight({ index: flightIndex, date });
    }
  };

const formatCustomDate = (date) => {
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate();
    const shortMonth = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    return `${dayOfWeek}, ${dayOfMonth} ${shortMonth}`;

  };

const loadConfig = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('url');
      const savedUsername = await AsyncStorage.getItem('username');
      const savedClave = await AsyncStorage.getItem('clave');
      const savedRosterData = await AsyncStorage.getItem('rosterData');
      if (savedUrl) {
        setUrl(savedUrl);
      }
      if (savedUsername) {
        setUsername(savedUsername);
      }
      if (savedClave) {
        setClave(savedClave);
      }
      if (savedRosterData) {
        setRosterData(JSON.parse(savedRosterData));
      }
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
    }
  };

useEffect(() => {
    loadConfig();
  }, []);

const saveConfig = async () => {
    try {
      await AsyncStorage.setItem('url', url);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('clave', clave);

      if (Platform.OS === 'android') {
        ToastAndroid.show('Datos guardados', ToastAndroid.SHORT);
      } else {
      //  Toast.show('Datos guardados', { duration: Toast.durations.SHORT });
      }
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      Alert.alert('Error al guardar la configuración');
    }
  };
  
useEffect(() => {
    if (url && username && clave) {
      webViewRef.current?.reload();
    }
  }, [url, username, clave]);

  /// PROCESA INFORMACION DEL PORTAL WEB  //////////  
const processHTML = (html) => {
    if (typeof html !== 'string') {
      html = html.toString();
    }
  
    const $ = cheerio.load(html);
    const extractedData = [];
    let lastETD = null;
  
    $('table[id="_tabRoster"] tr').each((index, element) => {
      const rowData = {};
  
      const hasTWBorderBottom = $(element).hasClass('TWBorderBottom');
  
      if (!$(element).find('td.RosterRowActivity').length && hasTWBorderBottom) {
        const twBorderBottom = $(element).find('.TWBorderBottom').text();
        rowData.TWBorderBottom = twBorderBottom.trim();
      } else {
        rowData.CheckIn = $(element).find('td.RosterRowCheckin').text();
        rowData.NroVuelo = $(element).find('td.RosterRowActivity').text();
        rowData.ETD = $(element).find('td.RosterRowStart').text();
        rowData.Dep = $(element).find('td.RosterRowDep').text();
        rowData.Arr = $(element).find('td.RosterRowArr').text();
        rowData.ETA = $(element).find('td.RosterRowEnd').text();
        rowData.CheckOut = $(element).find('td.RosterRowCheckout').text();
        rowData.Avion = $(element).find('td.RosterRowAcType').text();
  
        if (rowData.ETD) {
          lastETD = rowData.ETD;
        } else if (lastETD) {
          rowData.ETD = lastETD;
        }
  
        const crewTable = $(element).find('table[id^="cob_"]');
        if (crewTable.length > 0) {
          const crewData = [];
          crewTable.find('tr.selectrow1, tr.selectrow0').each((crewIndex, crewElement) => {
            const crewRowData = {};
            crewRowData.Role = $(crewElement).find('td.COBSameCrewType, td.COBNotSameCrewType').first().text();
            crewRowData.OP = $(crewElement).find('td').eq(1).text();
            crewRowData.Name = $(crewElement).find('td').eq(2).text();
            crewData.push(crewRowData);
          });
  
          if (crewData.length > 0) {
            rowData.Crew = crewData;
          }
        }
  
        if (!isEmptyCrewRow(rowData)) {
          const ETD = rowData.ETD;
          const ETA = rowData.ETA;
  
          if (ETD && ETA) {
            const ETDTimeParts = ETD.slice(-5).split(":");
            const ETDHours = parseInt(ETDTimeParts[0], 10);
            const ETDMinutes = parseInt(ETDTimeParts[1], 10);
  
            const ETATimeParts = ETA.slice(-5).split(":");
            const ETAHours = parseInt(ETATimeParts[0], 10);
            const ETAMinutes = parseInt(ETATimeParts[1], 10);
  
            const diffInMinutes = (ETAHours * 60 + ETAMinutes) - (ETDHours * 60 + ETDMinutes);
            const FT = Math.abs(diffInMinutes / 60);
            const horas = Math.floor(FT);
            const minutosDecimal = (FT - horas) * 60;
  
            const horasFormateadas = horas < 10 ? `0${horas}` : horas.toString();
            const minutosFormateados = minutosDecimal < 10 ? `0${minutosDecimal.toFixed(0)}` : minutosDecimal.toFixed(0);
  
            const TiempoDeVuelo = `${horasFormateadas}:${minutosFormateados}`;
            rowData.TiempoDeVuelo = TiempoDeVuelo;
          }
  
          extractedData.push(rowData);
        }
      }
    });
  
    return extractedData;
  }; 

const handleMessage = (event) => {
    const datos = event.nativeEvent.data;
    if (vencimiento > hoy) {
      console.log('ACTUALIZANDO ROSTER')
      const processedData = processHTML(datos);
      setRosterData(processedData);

      AsyncStorage.setItem('rosterData', JSON.stringify(processedData))
        .then(() => {
          // ... Resto del código ...
        })
        .catch((error) => {
          console.error('Error al guardar RosterData:', error);
        });
    }
  };
  ///verifica si una fila es una fila vacía de tripulación
const isEmptyCrewRow = (rowData) => {
    return (
      !rowData.CheckIn &&
      !rowData.NroVuelo &&
      !rowData.Dep &&
      !rowData.Arr &&
      !rowData.ETD &&
      !rowData.ETA &&
      !rowData.CheckOut &&
      !rowData.Avion &&
      (!rowData.Crew || rowData.Crew.length === 0)
    );
  };

  ////Agrupa los datos en items segun el dia
const groupDataByDay = (data) => {
  const groupedData = {};

  if (Array.isArray(data)) {
    data.forEach((item) => {
      const cadena = item.ETD;
      const match = cadena.match(/\d{2}[A-Z]{3}/);

      if (match) {
        const dateKey = match[0];

        if (!groupedData[dateKey]) {
          groupedData[dateKey] = {
            date: dateKey,
            items: [],
            totalTSV: 0,
          };
        }
        groupedData[dateKey].items.push(item);

        if (item.CheckIn || item.CheckOut) {
  //      console.log(`LOG  Date Key: ${dateKey}`);
          if (item.CheckIn) {
  //        console.log(`LOG  CheckIn: ${item.CheckIn}`);
          }
          if (item.CheckOut) {
  //        console.log(`LOG  CheckOut: ${item.CheckOut}`);
          }
        }
      }
    });

    const groupedDataArray = Object.values(groupedData);

    groupedDataArray.forEach((group) => {
      const totalHours = Math.floor(group.totalTSV / (60 * 60 * 1000));
      const totalMinutes = Math.floor((group.totalTSV % (60 * 60 * 1000)) / (60 * 1000));
      const totalTSV = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`;
      group.tsv = totalTSV;
    });

    return groupedDataArray;
  }

  return [];
};
const groupedRosterData = groupDataByDay(rosterData);
  
const formatDate = (dateStr) => {
  // Mapa de nombres de meses abreviados a números de mes
  const monthMap = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };

  // Extraer el día y el mes de la cadena
  const day = parseInt(dateStr.substring(0, 2), 10);
  const monthStr = dateStr.substring(2, 5);
  const month = monthMap[monthStr];

  // Obtener el año actual (puedes ajustar esto según tus necesidades)
  const currentYear = new Date().getFullYear();

  // Crear una nueva fecha con el año actual, mes y día
  const date = new Date(currentYear, month, day);

  // Obtener el día de la semana como texto
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const dayOfWeek = daysOfWeek[date.getDay()];

  // Obtener el día del mes
  const dayOfMonth = date.getDate();
  
  // Obtener el mes como texto abreviado
  const shortMonth = date.toLocaleString('default', { month: 'short' }).toUpperCase();

  // Formatear la fecha con el día de la semana y el día del mes
  return `${dayOfWeek}, ${dayOfMonth} ${shortMonth}`;
};

const formatCheckIn = (checkInStr) => {
    // Usar una expresión regular para seleccionar la hora y los minutos
    const match = checkInStr.match(/\d{2}:\d{2}/);

    if (match) {
      const time = match[0];
      return `Checkin ${time}`;
    } else {
      // Manejar el caso en el que no se encuentra una hora válida
      return checkInStr; // O podrías devolver un mensaje de error o un valor predeterminado
    }
  };
const extractTime = (dateTimeStr) => {
    // Usar una expresión regular para buscar la hora y los minutos en el formato HH:mm
    const match = dateTimeStr.match(/\d{2}:\d{2}/);

    if (match) {
      return match[0]; // Devolver la hora y los minutos en el formato HH:mm
    } else {
      // Manejar el caso en el que no se encuentra una hora válida
      return dateTimeStr; // O podrías devolver un mensaje de error o un valor predeterminado
    }
  };

/// colorea los items del Roster intercalando color  
const getColorByDate = () => {
    // Crea un objeto para rastrear el color asignado a cada fecha
    const colorMap = {};
  
    // Define un arreglo de colores disponibles
    const colors = ['lightgrey', 'lightblue'];
  
    return (date) => {
      if (!colorMap[date]) {
        // Si no se ha asignado un color para esta fecha, asigna uno nuevo
        const currentIndex = Object.keys(colorMap).length % colors.length;
        colorMap[date] = colors[currentIndex];
      }
  
      // Devuelve el color asignado para la fecha
      return colorMap[date];
    };
  };

const addHttpToUrl = (inputUrl) => {
    const lowercasedUrl = inputUrl.toLowerCase();
    if (!lowercasedUrl.startsWith("http://") && !lowercasedUrl.startsWith("https://")) {
      return `http://${inputUrl}`;
    }
    return inputUrl;
  };

const getColor = getColorByDate();

function calculateDayDifference(items) {
  const checkIns = items.filter(item => item.CheckIn);
  const checkOuts = items.filter(item => item.CheckOut);

  if (checkIns.length === 0) {
    return "N/A";
  }

  // Si hay CheckIn pero no hay CheckOut en el mismo día
  if (checkIns.length > checkOuts.length) {
    // Obtén el próximo CheckOut en días subsiguientes
    const nextCheckOut = items.find(item => item.CheckOut && !item.CheckIn);
    
    if (nextCheckOut) {
      console.log('Tomando el proximo OUT')

      const checkInTime = parseTime(checkIns[0].CheckIn);
      const checkInMS = checkInTime ? checkInTime.getTime() : 0;

      const nextCheckOutTime = parseTime(nextCheckOut.CheckOut);
      const nextCheckOutMS = nextCheckOutTime ? nextCheckOutTime.getTime() : 0;

      // Calcular la diferencia utilizando el próximo CheckOut
      console.log('In' + checkInMS)
      console.log('NextOut'+ nextCheckOutMS)
      var groupTotalDifference = nextCheckOutMS - checkInMS;

      // Asegurar que la diferencia sea positiva
      if (groupTotalDifference < 0) {
        groupTotalDifference += 24 * 60 * 60 * 1000; // Agregar un día en milisegundos
      }

      const groupHours = Math.floor(groupTotalDifference / (60 * 60 * 1000));
      const groupMinutes = Math.floor((groupTotalDifference % (60 * 60 * 1000)) / (60 * 1000));
      const groupFormattedDifference = `${groupHours.toString().padStart(2, '0')}:${groupMinutes.toString().padStart(2, '0')}`;

      return groupFormattedDifference;
    }
  }

  // Resto del código para cuando hay tanto CheckIn como CheckOut
  const groupInMS = checkIns.reduce((accumulator, currentItem) => {
    if (currentItem.CheckIn) {
      const checkInTime = parseTime(currentItem.CheckIn);
      if (checkInTime) {
        accumulator += checkInTime.getTime();
      }
    }
    return accumulator;
  }, 0);

  const groupOutMS = checkOuts.reduce((accumulator, currentItem) => {
    if (currentItem.CheckOut) {
      const checkOutTime = parseTime(currentItem.CheckOut);
      if (checkOutTime) {
        accumulator += checkOutTime.getTime();
      }
    }
    return accumulator;
  }, 0);

  var groupTotalDifference = groupOutMS - groupInMS;
 // Manejar el caso de horarios PM y AM
  if (groupTotalDifference < 0) {
    groupTotalDifference += 24 * 60 * 60 * 1000; // Agregar un día completo en milisegundos
  }
  const groupHours = Math.floor(groupTotalDifference / (60 * 60 * 1000));
  const groupMinutes = Math.floor((groupTotalDifference % (60 * 60 * 1000)) / (60 * 1000));
  const groupFormattedDifference = `${groupHours.toString().padStart(2, '0')}:${groupMinutes.toString().padStart(2, '0')}`;

  return groupFormattedDifference;
}

// Función para convertir una cadena de tiempo en un objeto Date
function parseTime(timeString) {
  const time = timeString.slice(-5);
  const timeParts = time.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  if (!isNaN(hours) && !isNaN(minutes)) {
    const currentDate = new Date();
    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);
    return currentDate;
  } else {
    return null;
  }
}

function convertirHoraAMilisegundos(horaString) {
  const [hour, minute] = horaString.split(':').map(Number);
  const date = new Date();
  date.setHours(hour);
  date.setMinutes(minute);
  date.setSeconds(0); // Establecemos los segundos en 0

  return date.getTime(); // Obtenemos los milisegundos
}

const calculateTotalDifferenceForEachGroup = (groupedRosterData) => {
  const updatedGroupedData = groupedRosterData.map((group) => {
    const totalDifference = calculateDayDifference(group.items);
    return {
      ...group,
      tsv: totalDifference,
    };
  });

  return updatedGroupedData;
};

// Llamar a la función y obtener los resultados actualizados
const groupedRosterDataWithTotalDifference = calculateTotalDifferenceForEachGroup(groupedRosterData);

function calculateDayDifference(items) {
  const checkIns = items.filter(item => item.CheckIn);
  const checkOuts = items.filter(item => item.CheckOut);
  const ETAs = items.filter(item => item.ETA);

  if (checkIns.length === 0 || checkOuts.length === 0) {
    return "";
  }

  // Si hay CheckIn pero no hay CheckOut en el mismo día
  if (checkOuts.length === 0) {
    console.log('Item sin Checkout');

    // Obtén el próximo evento (CheckOut o ETA) en días subsiguientes
    const now = new Date();
    const futureEvents = [...checkOuts, ...ETAs].filter(item => parseTime(item) > now);
    const nextEvent = futureEvents.reduce((min, item) => {
      const itemTime = parseTime(item);
      return itemTime && itemTime < parseTime(min) ? item : min;
    }, futureEvents[0]);

    console.log('Next Event:', nextEvent);

    if (nextEvent) {
      console.log('Tomando el próximo OUT o ETA');

      const checkInTime = parseTime(checkIns[0].CheckIn);
      const checkInMS = checkInTime ? checkInTime.getTime() : 0;

      const nextEventTime = parseTime(nextEvent);
      const nextEventMS = nextEventTime ? nextEventTime.getTime() : 0;

      // Calcular la diferencia utilizando el próximo CheckOut o ETA
      console.log('******In' + checkInMS);
      console.log('****NextEvent' + nextEventMS);
      
      // Si el próximo evento es un CheckOut y comienza en otro día, ajusta la fecha
      if (nextEvent.CheckOut && nextEventMS > checkInMS) {
        nextEventMS -= 24 * 60 * 60 * 1000; // Restar un día en milisegundos
      }

      var groupTotalDifference = nextEventMS - checkInMS;

      // Asegurar que la diferencia sea positiva
      if (groupTotalDifference < 0) {
        groupTotalDifference += 24 * 60 * 60 * 1000; // Agregar un día en milisegundos
      }

      const groupHours = Math.floor(groupTotalDifference / (60 * 60 * 1000));
      const groupMinutes = Math.floor((groupTotalDifference % (60 * 60 * 1000)) / (60 * 1000));
      
      // Mostrar espacio en blanco si el formato del TSV es diferente a "00:00"
      const groupFormattedDifference = groupHours === 0 && groupMinutes === 0
        ? "00:00"
        : `${groupHours.toString().padStart(2, '0')}:${groupMinutes.toString().padStart(2, '0')}`;

      return groupFormattedDifference;
    } else {
      console.log('No hay CheckOut o ETA futuro encontrado.');
    }
  }

  // Resto del código para cuando hay tanto CheckIn como CheckOut
  const groupInMS = checkIns.reduce((accumulator, currentItem) => {
    if (currentItem.CheckIn) {
      const checkInTime = parseTime(currentItem.CheckIn);
      if (checkInTime) {
        accumulator += checkInTime.getTime();
      }
    }
    return accumulator;
  }, 0);

  const groupOutMS = checkOuts.reduce((accumulator, currentItem) => {
    if (currentItem.CheckOut) {
      const checkOutTime = parseTime(currentItem.CheckOut);
      if (checkOutTime) {
        accumulator += checkOutTime.getTime();
      }
    }
    return accumulator;
  }, 0);

  var groupTotalDifference = groupOutMS - groupInMS;
  // Manejar el caso de horarios PM y AM
  if (groupTotalDifference < 0) {
    groupTotalDifference += 24 * 60 * 60 * 1000; // Agregar un día completo en milisegundos
  }
  const groupHours = Math.floor(groupTotalDifference / (60 * 60 * 1000));
  const groupMinutes = Math.floor((groupTotalDifference % (60 * 60 * 1000)) / (60 * 1000));

  // Mostrar espacio en blanco si el formato del TSV es diferente a "00:00"
  const groupFormattedDifference = groupHours === 0 && groupMinutes === 0
    ? "00:00"
    : `${groupHours.toString().padStart(2, '0')}:${groupMinutes.toString().padStart(2, '0')}`;

  return groupFormattedDifference;
}

function calculateDayDifferenceWithTTEE(items) {
  const checkIns = items.filter(item => item.CheckIn);
  const checkOuts = items.filter(item => item.CheckOut);

  if (checkIns.length === 0 || checkOuts.length === 0) {
    return "";
  }

  // Resto del código para cuando hay tanto CheckIn como CheckOut
  const groupInMS = checkIns.reduce((accumulator, currentItem) => {
    if (currentItem.CheckIn) {
      const checkInTime = parseTime(currentItem.CheckIn);
      if (checkInTime) {
        accumulator += checkInTime.getTime();
      }
    }
    return accumulator;
  }, 0);

  const groupOutMS = checkOuts.reduce((accumulator, currentItem) => {
    if (currentItem.CheckOut) {
      const checkOutTime = parseTime(currentItem.CheckOut);
      if (checkOutTime) {
        accumulator += checkOutTime.getTime();
      }
    }
    return accumulator;
  }, 0);

  var groupTotalDifference = groupOutMS - groupInMS;
  // Manejar el caso de horarios PM y AM
  if (groupTotalDifference < 0) {
    groupTotalDifference += 24 * 60 * 60 * 1000; // Agregar un día completo en milisegundos
  }
  const groupHours = Math.floor(groupTotalDifference / (60 * 60 * 1000));
  const groupMinutes = Math.floor((groupTotalDifference % (60 * 60 * 1000)) / (60 * 1000));

  // Restar 30 minutos en milisegundos para obtener TTEE
  let TTEEinMS = groupTotalDifference - 30 * 60 * 1000;

  // Asegurar que la diferencia sea positiva
  if (TTEEinMS < 0) {
    TTEEinMS = 0;
  }

  const TTEEHours = Math.floor(TTEEinMS / (60 * 60 * 1000));
  const TTEEMinutes = Math.floor((TTEEinMS % (60 * 60 * 1000)) / (60 * 1000));

  // Mostrar espacio en blanco si el formato del TTEE es diferente a "00:00"
  const TTEEFormatted = TTEEHours === 0 && TTEEMinutes === 0
    ? "00:00"
    : `${TTEEHours.toString().padStart(2, '0')}:${TTEEMinutes.toString().padStart(2, '0')}`;

  return TTEEFormatted;
}
// Mostrar los resultados actualizados en el registro
groupedRosterDataWithTotalDifference.forEach((group, index) => {
 // console.log(`Grupo ${index + 1}: TSV - ${group.tsv}`);
} );

const clearCookies = async () => {
  try {
    const cleard = await CookieManager.clearAll();
    console.log('Cookies cleared:', cleard);
  } catch (error) {
    console.error('Error clearing cookies:', error);
  }
};

  return (
<>
    <View style={Styles.container}>
     <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" />
   
    <View style={Styles.inputContainer}>
      <Text style={Styles.label}>Ingresa la dirección Web de tu plan de vuelo:</Text>
      <TextInput
        style={Styles.input}
        placeholder="http://portal.com.ar/ccweb/CWPLog/cwp_warT....."
        value={url}
        onChangeText={(text) => setUrl(text)}
      />
    </View>

    <View style={[Styles.inputContainer, Styles.grayBackground]}>
      <Text style={Styles.label}>Usuario</Text>
     <View style={{flexDirection:'row',
                  alignItems:'center', 
                  alignContent:'space-between'}}> 
      <TextInput
      style={{ ...Styles.input, width: '38%' }}
      placeholder="Legajo..."
        value={username}
        onChangeText={(text) => setUsername(text)}
      />

      <View style={{flexDirection:'row',
                    justifyContent:'space-between',
                  }}>
           <View style={{ marginLeft: 20 }}>
           
        <Button
        title="Ingresar"
        onPress={() => {
          console.log('*********BOTON INGRESAR')
          webViewRef.current?.injectJavaScript(`
            var usernameInput = document.querySelector('input[id="_login_ctrlUserName"]');
            var passwordInput = document.querySelector('input[id="_login_ctrlPassword"]');
            if (usernameInput && passwordInput) {
              usernameInput.value = '${username}';
              passwordInput.value = '${clave}';
              var loginButton = document.querySelector('input[id="_login_btnLogin"]');
              if (loginButton) {
                loginButton.click();
              }
            }
          `);

              // Limpiar cookies
              clearCookies();

          console.log('///'+username)
          webViewRef.current?.reload();
        }
      } /> 
    </View>

    <TouchableOpacity
            style={{ 
            marginLeft:6,  
            backgroundColor: 'brown', // Cambia el color a tu preferencia
            paddingVertical: 6,
            borderRadius: 4,
            marginVertical:0,}}
            onPress={()=>setUserDataModal(true)}>

            <Text style={Styles.registerButtonText}>Cuenta</Text>

          </TouchableOpacity>
         
    </View>   
  </View> 
     
      <Text style={Styles.label}>Contraseña</Text>
  
      <View style={Styles.passwordContainer}>
       <View style={{flexDirection:'row',
                     justifyContent:'center',
                     alignContent:'center',
                     alignItems:'center'}}>
        <TextInput
          style={Styles.input}
          placeholder="Contraseña..."
          secureTextEntry={!showPassword} // Usar secureTextEntry según el estado showPassword
          value={clave}
          onChangeText={(text) => setClave(text)}
        />
         <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)} // Cambiar el estado showPassword al tocar
        >
          <Feather
            style={{marginLeft:4}}
            name={showPassword ? "eye-off" : "eye"} // Cambiar el ícono según el estado showPassword
            size={24}
            color={showPassword ? "grey" : "black"} // Cambiar el color del ícono según el estado showPassword
          />
        </TouchableOpacity>
        </View>
       <View styles={{flexDirection:'column', borderWidth:2, borderColor:'red'}}> 
       <CustomCheckBox
        label="Recordar datos"
        checked={rememberData}
        onChange={(isChecked) => {
        setRememberData(isChecked);
    // Almacena el estado del CheckBox en AsyncStorage
        AsyncStorage.setItem('rememberData', JSON.stringify(isChecked));
    // Luego, puedes realizar otras acciones según sea necesario
       if (isChecked) {
        saveConfig();
      }else {
      // Puedes eliminar los datos guardados si el CheckBox se desmarca
      AsyncStorage.removeItem('url');
      AsyncStorage.removeItem('username');
      AsyncStorage.removeItem('clave');
     }
    }} />
       
        </View>
      </View>

    </View>
    
     {esVigente ? (
	  <Button
    title="Descargar Roster "
    onPress={() => {
 
      //ENTRADA A PLAN CON LAS CREDENCIALES CARGADAS
    webViewRef.current?.injectJavaScript(`
            var usernameInput = document.querySelector('input[id="_login_ctrlUserName"]');
            var passwordInput = document.querySelector('input[id="_login_ctrlPassword"]');
            if (usernameInput && passwordInput) {
              usernameInput.value = '${username}';
              passwordInput.value = '${clave}';
              var loginButton = document.querySelector('input[id="_login_btnLogin"]');
              if (loginButton) {
                loginButton.click();
              }
            }
          `); 
    /////////////////////////////////////////////
    
    ///////LEYENDO DATOS DEL PLAN
      webViewRef.current?.injectJavaScript(`
        var roster = document.querySelector('table[id="_tabRoster"]');
        if (roster) {
          var rosterHTML = roster.outerHTML;
          window.ReactNativeWebView.postMessage(rosterHTML);
        }
      `);
    /////////////////////////////////////////////////////////////  
      if (Platform.OS === 'android') {
        ToastAndroid.show('Actualizando Roster...', ToastAndroid.SHORT);
      } else {
        // Toast.show('Roster actualizado', { duration: Toast.durations.SHORT });
      }
     // Antes de llamar a setShowModal(true), usa setTimeout
    setTimeout(() => {
    setShowModal(true);
   }, 1500); // 3000 milisegundos (3 segundos)
  }
}
  
  />
      ) : (
  <View>
       <Button title="Obtener acceso anual" onPress={() => setModalVisible(true)} />      
  </View>
      )} 
 <Button
      title="Ver Roster"
      onPress={() => {
      // navigation.navigate('RosterScreen', { groupedRosterData, currentDate })
      setShowModal(true);
      }} />
  <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(!modalVisible);
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: '#f8f8ff', padding: 20, borderRadius: 10, width: '80%' , borderWidth:2}}>
          
          <View style={{padding:6,
                        borderWidth:1,
                        borderRadius:12,
                        marginBottom:18,
                        borderStyle:'dotted'}}>
                      
           <Text style={{ marginBottom: 16, fontSize:20 }}>
            Por favor, asegúrate de que tu Email registrado en Sky Roster coincida con el Email de tu cuenta de MercadoPago. Esto es necesario para poder verificar la transacción.
           </Text>

           <CustomCheckBox label="Entendido" checked={checkboxValue} onChange={handleCheckboxChange} />
           </View>  
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Cerrar" onPress={() => setModalVisible(false)} />           
           <TouchableOpacity
           onPress={handleBuy}
           style={{ opacity: checkboxValue ? 1 : 0.5 }} 
           disabled={!checkboxValue}>
           <View style={{borderRadius:8, borderWidth:2, borderColor:'#00bfff'}}>
            <Image source={require('../assets/Boton-mercadopago1.png')}
            
            />
           </View>
           </TouchableOpacity> 
          </View>
        </View>
      </View>
    </Modal>

    <Modal
      visible={borrar}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setBorrar(!borrar);
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
          <Text style={{ marginBottom: 10 }}>¿Seguro que deseas borrar tu cuenta? Estas eliminando tus datos ingresados y tu suscripcion.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="No" onPress={()=>setBorrar(false)} />
            <Button title="Borrar cuenta" onPress={borrarCuenta} />
          </View>
        </View>
      </View>
    </Modal>

<Modal
  visible={showModal}
  animationType="slide"
  onRequestClose={() => setShowModal(false)}
>
  <View style={{flex:1,
     marginTop:Platform.OS === 'ios' ? margenSup : 0,
     }}>
    
    <View style={Styles.contenedorTitulo}>
    <Text style={Styles.titulo}>
     Sky Roster  
    </Text>
    <Fontisto name="cloudflare" size={42} color="white"  style={{paddingVertical:0, alignSelf:'center', marginTop:3}} />
    </View>

    <ScrollView style={{ flex: 1 }}>
      {groupedRosterData.map((group, index) => (
      
      <View 
        style={Styles.Modal}
        key={index}>     
        
        <View style={{flexDirection:'row',
                      justifyContent:'space-between',
                      borderWidth:1,
                      borderColor:'black',
                      backgroundColor: formatDate(group.date) === formatCustomDate(currentDate) ? '#FFFCCB' : 'white',
                    }}>
          <Text style={{
            textAlign: 'left',
            paddingHorizontal: 4,
            paddingVertical: 2,
            fontWeight: 'bold',
          //  borderWidth: 1,
          //  borderColor: 'violet',
            fontSize: formatDate(group.date) === formatCustomDate(currentDate) ? 20 : 16,
            color: formatDate(group.date) === formatCustomDate(currentDate) ? 'black' : 'black',
            backgroundColor: formatDate(group.date) === formatCustomDate(currentDate) ? '#FFFCCB' : 'white',
          }}>
        
        {formatDate(group.date)}
        
        </Text>
        
   
       <View style={{flexDirection:'row',
                     justifyContent:'flex-end',
                     alignItems:'center'}}>
        
        {group.items.length > 1 && (
        <Text style={Styles.textTsv}>
              TSV: {calculateDayDifference(group.items)}
        </Text>
      )}
      {group.items.length > 1 && (
        <Text style={Styles.textTtee}>
             TTEE: {calculateDayDifferenceWithTTEE(group.items)}
        </Text>
      )}
      </View>
    </View>

          {group.items.map((item, itemIndex,) => {

            const hasDepArr = item.Dep && item.Arr;
            const hasETD = item.ETD;
            const hasETA = item.ETA;
            const hasAvion = item.Avion && item.Avion !== ' ';
            const hasCheckIn = !!item.CheckIn && item.NroVuelo !== 'GUA';
            const hasCheckOut = !!item.CheckOut && item.NroVuelo !== 'GUA';
            const hasNroVuelo = item.NroVuelo && item.NroVuelo !== ' ';
            const hasCrew = item.Crew && item.Crew.length > 0; // Verifica si hay información de tripulación

         //   console.log("extractedTIme"+extractTime(item.CheckOut))
      //////TSV

        var OutMS = 0;
        var InMS = 0;
        const CheckInHora = item.CheckIn.slice(-5);
        InMS = convertirHoraAMilisegundos(CheckInHora);

      if (hasCheckIn) {
//        console.log('In Hora:', CheckInHora);
        
      //   InMS = convertirHoraAMilisegundos(CheckInHora);
//        console.log('InMS: '+InMS); // Resultado en milisegundos

      }
      if(hasCheckOut){
        const CheckOutHora = item.CheckOut.slice(-5);
//        console.log('Out Hora:', CheckOutHora);

         OutMS = convertirHoraAMilisegundos(CheckOutHora);
//       console.log(OutMS); // Resultado en milisegundos      
//       console.log('*****: '+ (OutMS-InMS) )
        var Dif = OutMS-InMS
        const fecha = new Date(Dif);
        const horas = fecha.getHours().toString().padStart(2, '0');
        const minutos = fecha.getMinutes().toString().padStart(2, '0');
        const horaEnFormatoHHMM = `${horas}:${minutos}`;
        
//        console.log('IN-MS '+ InMS);
//        console.log('OUT-MS '+ OutMS); 
//       console.log('///////'+ horaEnFormatoHHMM); // Resultado en formato HH:MM
      }
       
// Ejemplo de uso para item.CheckIn y item.CheckOut
const checkInTime = parseTime(item.CheckIn);
const checkOutTime = parseTime(item.CheckOut);

// Calcula la diferencia de tiempo
if (checkInTime && checkOutTime) {
  const timeDifference = checkOutTime - checkInTime;
  
  // Obtiene horas y minutos de la diferencia
  const hours = Math.floor(timeDifference / (60 * 60 * 1000));
  const minutes = Math.floor((timeDifference % (60 * 60 * 1000)) / (60 * 1000));

  // Formatea la diferencia de tiempo en "HH:MM"
  var tsv = (OutMS - InMS);

//console.log('TSV: '+ tsv)
  // Ahora puedes mostrar 'tsv' en tu interfaz donde lo necesites
}
      


          ///////////////////
            // Comprueba si tienes datos válidos antes de renderizar la sección
          if (!item.CheckIn &&
              (!item.NroVuelo || item.NroVuelo.trim() === '') &&
              (!item.Dep || !item.Arr) &&
              (!item.ETD || !item.ETA) &&
              !item.CheckOut &&
              (!item.Avion || item.Avion.trim() === '') &&
              (!item.Crew || item.Crew.length === 0 || item.Crew === ' ') &&
              (!item.NroVuelo || item.NroVuelo === '') ||
              (!item.CheckIn && !item.NroVuelo && 
                !item.Dep && !item.Arr && !item.ETD && 
                !item.ETA && !item.CheckOut && !item.Avion 
                && (!item.Crew || item.Crew.length === 0 || item.Crew === ' '))
            ) {
              return null; // Evitar renderizar elementos vacíos
            }
           
          if ((!item.CheckIn && !item.NroVuelo && !item.Dep &&
               !item.Arr && !item.ETD && !item.ETA && !item.CheckOut && !item.Avion) &&
              (!hasCrew || (hasCrew && item.Crew.every(crewMember => !crewMember.Name)))
            ) {
              return null; // Evitar renderizar elementos vacíos
            }

            return (
              <View
                key={itemIndex}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  borderWidth: 1.5,
                  borderColor: 'black',
                  opacity:
                    formatDate(group.date) === formatCustomDate(currentDate) ? 1 : 0.64,
                  backgroundColor:
                    formatDate(group.date) === formatCustomDate(currentDate)
                      ? '#FFFCCB'
                      : getColor(group.date),
                  marginBottom: 0,
                  margin:0,
                }}
              > 
                 {/* Columna: datos del vuelo */} 
                 {(!hasCrew || (hasCrew && item.Crew.every(crewMember => !crewMember.Name))) && (
 
                  <View style={Styles.datosActividad} 
                        id={'datosVuelo'}>
                  
                  <View style={{flexDirection:'column', borderColor:'green', borderWidth:0  }}>
                  
                  <View style={{ flexDirection: 'column', borderColor:'red', borderWidth:0 }}>                    
                    {hasNroVuelo && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                          {item.NroVuelo === 'VAC' ? (
                            <>
                              <Fontisto name="holiday-village" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>VAC</Text>
                            </>
                          ) : item.NroVuelo === '*'  ? (
                            <>
                              {/* <FontAwesome name="home" size={24} color="black" /> */}
                            <View style={{flexDirection:'row',
                                          justifyContent:'center',
                                          alignContent:'center',
                                          alignItems:'center' }}>
                              <FontAwesome5 name="asterisk" size={20} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>DIA OFF</Text>
                            </View>
                            </>
                          ) : item.NroVuelo === 'ELD' || item.NroVuelo === 'ELR'  ? (
                            <>
                              <FontAwesome5 name="laptop-code" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>E-LEARNING</Text>
                            </>
                          )  : item.NroVuelo === 'VOP'  ? (
                            <>
                              <Fontisto name="holiday-village" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>Articulo</Text>
                            </>
                          ) : item.NroVuelo === 'MED' ? (
                            <>
                              <FontAwesome5 name="clinic-medical" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>MED</Text>
                            </>
                          ): item.NroVuelo === 'GUA' ? (
                            <>
                              <Fontisto name="clock" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>GUA</Text>
                            </>
                          ) : (item.NroVuelo === 'ESM' || item.NroVuelo === 'CUT') ? (
                            <>
                              <FontAwesome5 name="school" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>RECURRENT</Text>
                            </>
                          )  : item.NroVuelo === 'HTL' ? (
                            <>
                              <FontAwesome5 name="hotel" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}> HTL</Text>
                            </>
                          )  : item.NroVuelo === 'D/L' ? (
                            <>
                              <FontAwesome name="home" size={24} color="black"/> 
                              <Text style={{ fontSize: 16, marginLeft: 8 }}> D/L - DIA LIBRE</Text>
                            </>
                          )  : item.NroVuelo === 'NPR' ? (
                            <>
                              <FontAwesome name="home" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}> NPR</Text>
                            </>
                          )  : item.NroVuelo === 'HAB' ? (
                            <>
                              <Feather name="hexagon" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}> HAB</Text>
                            </>
                          )  : item.NroVuelo === 'GAB' ? (
                            <>
                              <FontAwesome5 name="clinic-medical" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>INMAE</Text>
                            </>
                          )   : item.NroVuelo === 'TOF' ? (
                            <>
                              <FontAwesome name="home" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>TOF</Text>
                            </>
                          )  : item.NroVuelo === 'S/P' ? (
                            <>
                              <FontAwesome name="home" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>S/P</Text>
                            </>
                          ) 
                          : (
                            <>
                              <Fontisto name="plane" size={20} color="black" />
                              <Text style={{ fontSize: 16 }}>   {item.NroVuelo}</Text>
                            </>
                          )}
                        </View>
                    )}
                  </View>
                    {hasDepArr && (
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={{ fontSize: 18 }}> {item.Dep} - </Text>
                        <Text style={{ fontSize: 18 }}> {item.Arr}</Text>
                        <Text style={{ fontSize: 18 }}> {item.FT}</Text>

                      </View>
                    )}
                    {hasETD && hasETA && hasAvion && (
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={{ fontSize: 18 }}>{extractTime(item.ETD)}</Text>
                        <Text style={{ fontSize: 18 }}> - {extractTime(item.ETA)} </Text>
                      </View>
                    )} 
                    {hasAvion && (
                      <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
                        <Text> Equipo: </Text>
                        <Ionicons name="airplane" size={18} color="black" />
                        <Text> {item.Avion} </Text>
                      </View>
                    )}               
                  </View> 
                
                  <View style={Styles.datosSecundarios}>
                  {hasCheckIn && (
                        <View style={Styles.checkInContainer}>
                          <FontAwesome5 name="chevron-circle-right" size={18} color="#556b2f" />
                        <Text style={Styles.CheckIn}>
                          {formatCheckIn(item.CheckIn)}
                        </Text>
                        
                        </View>
                  )}
                   {hasAvion && (
                      <View style={{flex:0.5,
                                    alignSelf:'center', 
                                    flexDirection: 'column',
                                   //  paddingVertical: 2,
                                    // justifyContent:'center', 
                                    // alignContent:'center',
                                    // alignItems:'center',
                                    // borderWidth:1,
                                     padding:0,
                                     borderRadius:20,
                                    // borderRadius:30,

                                     }}>
                        <Text style={{ fontSize: 18,
                                       textAlign:'center',
                                      // padding:3. 
                                       }}>Tiempo de vuelo:</Text>
                     
                      <View style={{flexDirection:'row',
                                    justifyContent:'space-around',
                                     marginTop:0,
                                     }}> 
                      <MaterialIcons name="flight-takeoff" size={22} color="black" />
                        <Text style={{ fontSize: 18,
                                       textAlign:'center',
                                      // padding:3,
                                      fontWeight:'bold',
                        }}>{extractTime(item.TiempoDeVuelo)} </Text>
                        <MaterialCommunityIcons name="airplane-landing" size={22} color="black" />
                      
                      </View>
                    </View>
                    )} 
                      
                   {hasCheckOut && (
                      <View  style={Styles.checkOutContainer}>
                        <Text style={Styles.CheckOut}>
                            Checkout  {extractTime(item.CheckOut)}
                        </Text>
                        <FontAwesome5 name="chevron-circle-left" size={18} color="#00008b" />  
      
                         {/* <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                        TSV:{tsv}
                        </Text>   */}
                      </View>
                    )                     
                  }           
                    
                  </View>     
                  </View>)}
                {/* Columna información de la tripulación */}
     {hasCrew && (
          
  <View style={Styles.menuTotalCrew}>
    <TouchableOpacity onPress={() => toggleCrewVisibility(itemIndex, item.ETD)}>
      
      <View style={{flexDirection:'row',
                    justifyContent:'flex-start',
                    marginLeft:5,
                    backgroundColor:
                    formatDate(group.date) === formatCustomDate(currentDate)
                      ? '#FFFCCB'
                      : getColor(group.date),}}>
      
      <Ionicons name="people" size={22} color="#191970" />
     
      <Text style={{ fontSize: 16,
                     marginLeft:4,
                     color:'#191970',
                     }}>
                     {selectedFlight && selectedFlight.index === itemIndex && selectedFlight.date === item.ETD
                     ? 'Tripulación' : 'Tripulación'}
      </Text>
      <MaterialCommunityIcons name={selectedFlight && selectedFlight.index === itemIndex && selectedFlight.date === item.ETD
              ? 'menu-up' 
              : 'menu-down'} size={24} color="#191970" />

              
      </View>

    {selectedFlight && selectedFlight.index === itemIndex && 
     selectedFlight.date === item.ETD && hasCrew && (
        <View style={Styles.menuCrew}>
        {item.Crew.map((crewMember, crewIndex) => (
          <Text key={crewIndex} style={{ fontSize: 14 }}>
            {crewMember.Role}: {crewMember.Name}
          </Text>
        ))}
      </View>
    )}
        </TouchableOpacity>
       
     

  </View>
)}
              </View>             
            );          
          })}
        </View>
      ))}
    </ScrollView>
 
  <View style={Styles.contenedorBotones}>        
   
    <TouchableOpacity 
    style={{flex:1}}
    onPress={()=>{setShowModal(false), navigation.navigate('Login')}}
      >
      <View style={Styles.botonesMenuInferior}>
      <Feather name="settings" size={20} color="white" />
        <Text style={Styles.txBotones}>Configuracion</Text>
      </View>
    </TouchableOpacity>

  { /* <TouchableOpacity 
    style={{flex:1}}
    onPress={()=>{setShowModal(false), navigation.navigate('Login')}}
      >
      <View style={Styles.botonesMenuInferior}>
      <FontAwesome name="refresh" size={20} color="white"/>
      <Text style={Styles.txBotones}>Actualizar Roster</Text>
      </View>
    </TouchableOpacity>*/}
  
  </View>  
</View>
</Modal>

<Modal
      animationType="slide"
      transparent={true}
      visible={userDataModal}
      onRequestClose={() => {
        setUserDataModal(false);
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
          <Text style={{ marginBottom: 10,
                         fontSize:16,
                         fontWeight:'bold',
           }}>
            Datos de tu cuenta:
          </Text>
           <Text style={{fontSize:16}}>Usuario: {userEmail} </Text>
           <Text style={{fontSize:16}}>Vigencia: {fechaCaducidad} </Text>


          <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginTop:20 }}>
            <Button title="Borrar cuenta" onPress={() => setBorrar(true)} />
            <Button title="Cerrar" onPress={() => setUserDataModal(false)} />


          </View>
        </View>
      </View>
    </Modal>   

      <View style={Styles.webview}>
        <WebView
          isVisiblle={false}
          ref={webViewRef}
          source={{ uri: addHttpToUrl(url) }}
          style={{ flex: 1 }}
          onMessage={handleMessage}
          onLoadEnd={() => {
          //  console.log('WebView cargado con éxito');
            webViewRef.current?.injectJavaScript(`
              var roster = document.querySelector('table[id="_tabRoster"]');
              if (roster) {
                console.log('Contenido del roster:', roster.outerHTML);
                window.ReactNativeWebView.postMessage(roster.outerHTML);
              }
            `);
          }}
          onError={(error) => {
            console.error('Error de WebView:', error);
            if (Platform.OS === 'android') {
              ToastAndroid.show('Error en el WebView', ToastAndroid.LONG);
            } else {
              // ARMAR TOAST PARA IOS
            }
          }}
        />
      </View>
    </View>
    
    </>
  );
}


const Styles = StyleSheet.create({

  container: {
    marginTop:margenSup,
    flex: 1,
    padding: 5,
    backgroundColor: '#f0f0f0',
  },
  inputContainer: {
    marginBottom: 20,
  },
  passwordContainer:{
    flexDirection:'row',
    alignContent:'center',
    alignItems:'center',
    justifyContent:'space-between'
  },
  label: {
    marginLeft: 5,
    marginBottom: 5,
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  grayBackground: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 10,
  },
  contenedorTitulo:{
   // height:0,
    borderTopLeftRadius:20,
    borderTopRightRadius:20,
    backgroundColor:'#191970',
    justifyContent:'center',
    alignItems:'center',
    alignContent:'center',
    flexDirection:'row',
    borderWidth:2,
    borderColor:'#b0c4de',
    borderBottomColor:'lime',
  },
  Modal:{
    borderWidth:3,
    borderColor:'#b0c4de',

  },
  titulo:{
  //  borderWidth: 2,
  //  borderColor: '#808000',
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 34,
    textTransform: 'none',
    padding: 6,
    paddingVertical: 4,
    borderRadius: 20,
   // marginHorizontal: '12%',
    marginTop: '1%',
    marginVertical: 6,
    fontWeight: 'bold',
    backgroundColor: `#191970`,
    textShadowColor: '#e6e6fa',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  menuTotalCrew:{
    flex: 1,
    borderWidth:0.3, 
    borderColor: 'blue',
    paddingLeft: 4, 
    alignContent:'center', 
    justifyContent:'center'
  },
  menuCrew:{
    flexDirection:'column',
    fontWeight:'bold',
    alignContent: 'center',
    backgroundColor: '#f5fffa',
    paddingLeft: 4, 
  },
  datosActividad:{
    flex: 1,
    borderColor:'red',
    marginLeft:6, 
    borderWidth:0, 
    flexDirection:'row',
    justifyContent:'space-between'
  },
  datosSecundarios:{
    flex:0.75,
    marginVertical:'2%',
 //   borderWidth:2,
    borderColor:'red',
    alignSelf:'center',
    justifyContent:'space-between', 
  //  marginRight:'8%',
  },
  webview:{
    flex: 1,
    borderWidth: 0.3,
    borderColor: 'black'
  },
  CheckIn:{
    marginLeft:4,
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 2,
    alignSelf:'flex-end',
  },
  CheckOut:{
   // borderWidth:1,
    marginRight:4,
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 2,
  //  alignSelf:'flex-end',
  },
  checkInContainer:{
    borderWidth:2,
    borderColor:'#556b2f',
    paddingHorizontal:3,
    borderRadius:10,
    backgroundColor:'#fffacd',
    marginLeft:8,
    marginTop:4,
    alignSelf:'center',
    flexDirection:'row',
    alignContent:'center',
    alignItems:'center',
  },
  checkOutContainer: {
    borderWidth:2,
    paddingHorizontal:3,
    borderColor:'#00008b',
    marginTop:4,
    borderRadius:10,
    backgroundColor:'#fffacd',
    marginRight:8,
    alignSelf:'center',
    flexDirection:'row',
    alignContent:'center',
    alignItems:'center',  
  },
  contenedorBotones:{
    backgroundColor: `#191970`,
    borderBottomLeftRadius:0,
    borderBottomRigthRadius:0,
   flexDirection: 'row',
   height:'5%',
   justifyContent:'center',
  },
  botonesMenuInferior:{
   flex:1,
   flexDirection:'row',
    borderWidth:1,
    borderColor:'white',
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center',
  },
  txBotones:{
  color:'white',
  marginLeft:3,
  marginRight:3,
  fontSize:16,  
  alignSelf:'center',
  fontWeight:'bold',
  textShadowColor: '#b0c4de',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 2,
  },
  registerButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal:4,
    
  },
  textTsv:{
    fontWeight: 'bold',
    borderWidth:2,
    fontSize:14,
    borderColor:'#98980C',
    borderRadius:10,
    paddingHorizontal:6,
    paddingVertical:0,
    paddingTop:0 ,
    backgroundColor:'#E4ECFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Para sombra en Android
  },
  textTtee: {
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: '6%',
    borderWidth: 2,
    borderColor: '#98980C',
    borderRadius: 10,
    backgroundColor: '#f0fff0',
    paddingHorizontal: 6,
    paddingVertical: 0, // Ajusta el espaciado vertical según tus preferencias
    // Agrega sombra
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Para sombra en Android
  },
});