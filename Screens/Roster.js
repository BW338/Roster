import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, Alert, Modal, Text, ScrollView, Toast, ToastAndroid, Platform, TouchableOpacity,StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomCheckBox from '../Routes/Components/Checkbox';
import { WebView } from 'react-native-webview';
import cheerio from 'cheerio';
import { useNavigation } from '@react-navigation/native';
import { Fontisto, FontAwesome, FontAwesome5, MaterialIcons, Ionicons, Feather, MaterialCommunityIcons  } from '@expo/vector-icons';
import { FIREBASE_AUTH } from "../FirebaseConfig"; // Asegúrate de importar el objeto auth de Firebase adecuadamente
import { initIAP } from 'react-native-iap';
import * as RNIap from 'react-native-iap';
import { getProducts } from 'react-native-iap';
import { requestPurchase } from 'react-native-iap';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


const currentDate = new Date(); // Obtiene la fecha actual


export default function Roster() {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [clave, setClave] = useState('');
  const webViewRef = useRef(null);
  const [showModal, setShowModal] = useState(true);
  const [rosterData, setRosterData] = useState(null);
  const today = new Date();
  const [crewData, setCrewData] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [accessAllowed, setAccessAllowed] = useState(true); // Estado para controlar si se permite el acceso
  const auth = FIREBASE_AUTH;
  const [showPassword, setShowPassword] = useState(false);
  const [rememberData, setRememberData] = useState(false);

  const navigation = useNavigation();

//////////////////////
useEffect(() => {
  // Función para verificar si ha pasado un mes desde el registro
  const checkAccess = async () => {
    try {
      const user = auth.currentUser;

      if (user) {
        // Obtén la fecha de registro del usuario desde Firestore
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid); // Asegúrate de que sea la misma colección 'users' que usaste al registrarte.
        const userSnapshot = await getDoc(userRef);
        const userData = userSnapshot.data();

        if (userData) {
          const registrationDate = userData.registrationDate.toDate();
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          // Compara la fecha de registro con la fecha actual menos un mes
          if (registrationDate <= oneMonthAgo) {
            // Ha pasado un mes, restringe el acceso
            setAccessAllowed(false);
          }
        }
      }
    } catch (error) {
      console.error('Error al verificar el acceso:', error);
    }
  };

  checkAccess();
}, []);  
///////////////////////////////
/*
//////////////////////////////////////////////////////////////////////////////
//////////////////FUNCIONES RELATIVAS A SUSCRIPCION///////////////////////////  

  async function obtenerProductos() {
    try {
      const products = await getProducts(['your_subscription_sku_here']);
      console.log('Productos:', products);
      // Aquí puedes realizar otras operaciones con los productos
    } catch (error) {
      console.error('Error al obtener productos:', error.message);
    }
  }
  // Llama a la función para obtener los productos
  obtenerProductos();

useEffect(() => {
//  RNIap.initConnection(); // Inicializar react-native-iap
}, []);

async function handlePurchase() {
  try {
    const purchase = await requestPurchase('your_subscription_sku_here');
    // Aquí puedes manejar la compra exitosa, por ejemplo, guardar el estado de la suscripción en tu aplicación.
    console.log('Compra exitosa:', purchase);
  } catch (error) {
    console.log('Suscripcion fallida')

    // Aquí puedes manejar errores, por ejemplo, mostrar un mensaje de error al usuario.
    console.error('Error en la compra:', error);
  }
}

////////////////////////////////////////////////////////////////////////  
*/
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
    return `${dayOfWeek}, ${dayOfMonth}${shortMonth}`;

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
        Toast.show('Datos guardados', { duration: Toast.durations.SHORT });
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

  const processHTML = (html) => {
    if (typeof html !== 'string') {
      html = html.toString();
    }
  
    const $ = cheerio.load(html);
    const extractedData = [];
    let lastETD = null; // Para mantener un seguimiento del último ETD encontrado
  
    // Selecciona y extrae filas con las clases "RosterOddRow" y "RosterEvenRow" dentro de la tabla HTML
    $('table[id="_tabRoster"] tr').each((index, element) => {
      const rowData = {};
  
      // Verifica si la fila tiene la clase 'TWBorderBottom'
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
  
        // Verifica si esta fila tiene información de tripulación y extrae esa información
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
          // Calcular la diferencia entre ETD y ETA y agregarla como FT
          const ETD = rowData.ETD;
          const ETA = rowData.ETA;
  
          if (ETD && ETA) {
            // Extraer las horas y minutos de ETD
            const ETDTimeParts = ETD.slice(-5).split(":");
            const ETDHours = parseInt(ETDTimeParts[0], 10);
            const ETDMinutes = parseInt(ETDTimeParts[1], 10);
          
            // Extraer las horas y minutos de ETA
            const ETATimeParts = ETA.slice(-5).split(":");
            const ETAHours = parseInt(ETATimeParts[0], 10);
            const ETAMinutes = parseInt(ETATimeParts[1], 10);
          
            // Calcular la diferencia en minutos entre ETD y ETA
            const diffInMinutes = (ETAHours * 60 + ETAMinutes) - (ETDHours * 60 + ETDMinutes);
          
            // Asegurarse de que FT sea siempre positivo
            var FT = Math.abs(diffInMinutes / 60);
          
            // Extraer la parte entera y decimal de FT
            const horas = Math.floor(FT);
            const minutosDecimal = (FT - horas) * 60;
          
            // Formatear las horas y minutos en HH:mm
            const horasFormateadas = horas < 10 ? `0${horas}` : horas.toString();
            const minutosFormateados = minutosDecimal < 10 ? `0${minutosDecimal.toFixed(0)}` : minutosDecimal.toFixed(0);
          
            const TiempoDeVuelo = `${horasFormateadas}:${minutosFormateados}`;
          // Agregar el tiempo de vuelo al objeto rowData
          rowData.TiempoDeVuelo = TiempoDeVuelo;
          }              
  
          
          
          extractedData.push(rowData);

        }
      }
    });
  
    return extractedData;
  };
  
  
  // Función auxiliar para verificar si una fila es una fila vacía de tripulación
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
            };
          }
  
          groupedData[dateKey].items.push(item);
        }
      });
    }
  
    // Convertir el objeto agrupado en un arreglo de objetos
    const groupedDataArray = Object.values(groupedData);
  
    return groupedDataArray;
  };
  const groupedRosterData = groupDataByDay(rosterData);
  
  const groupCrewDataByDay = (data) => {
    const groupedCrewData = {};
  
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const dateKey = item.ETD; // Utiliza el campo ETD como clave de fecha
  
        if (!groupedCrewData[dateKey]) {
          groupedCrewData[dateKey] = [];
        }
  
        groupedCrewData[dateKey].push(item);
      });
    }
  
    // Convertir el objeto agrupado en un arreglo de objetos
    const groupedCrewDataArray = Object.entries(groupedCrewData).map(([date, crew]) => ({
      date,
      crew,
    }));
  
    return groupedCrewDataArray;
  };
  
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
  
    // Formatear la fecha con el día de la semana
    return `${dayOfWeek}, ${dateStr}`;
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
  
const getColor = getColorByDate();

  return (
    <View style={Styles.container}>
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
      <TextInput
        style={Styles.input}
        placeholder="Legajo..."
        value={username}
        onChangeText={(text) => setUsername(text)}
      />
      
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

      <Button
        title="Ingresar"
        onPress={() => {
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
        }}
      />
       {accessAllowed ? (
        <Button
          title="Get Roster"
          onPress={() => {
            webViewRef.current?.injectJavaScript(`
              var roster = document.querySelector('table[id="_tabRoster"]');
              if (roster) {
                var rosterHTML = roster.outerHTML;
                window.ReactNativeWebView.postMessage(rosterHTML);
              }
            `);
            if (Platform.OS === 'android') {
              ToastAndroid.show('Roster actualizado', ToastAndroid.SHORT);
            } else {
              Toast.show('Roster actualizado', { duration: Toast.durations.SHORT });
            }
          }}
        />
      ) : (
        <Text>Acceso restringido. Han pasado más de 1 mes desde el registro.</Text>
      )}
      <Button
        title="Ver Roster"
        onPress={() => {
        // navigation.navigate('RosterScreen', { groupedRosterData, currentDate })
           setShowModal(true);
        }}
      />

<Modal
  visible={showModal}
  animationType="slide"
  onRequestClose={() => setShowModal(false)}
>
  <View style={Styles.container}>
    
    <View style={Styles.contenedorTitulo}>
    <Text style={Styles.titulo}>
      ROSTER  
    </Text>
    <Ionicons name="md-arrow-down-circle-sharp" size={34} color="white" />
    </View>

    <ScrollView style={{ flex: 1 }}>
      {groupedRosterData.map((group, index) => (
        <View 
        style={Styles.Modal}
        key={index}>
          <Text style={{
            textAlign: 'left',
            paddingHorizontal: 4,
            paddingVertical: 2,
            fontWeight: 'bold',
            borderWidth: 1,
          //  borderColor: 'violet',
            fontSize: formatDate(group.date) === formatCustomDate(currentDate) ? 20 : 16,
            color: formatDate(group.date) === formatCustomDate(currentDate) ? 'black' : 'black',
            backgroundColor: formatDate(group.date) === formatCustomDate(currentDate) ? '#fa8072' : 'white',
          }}>{formatDate(group.date)}</Text>
          {group.items.map((item, itemIndex) => {
            const hasDepArr = item.Dep && item.Arr;
            const hasETD = item.ETD;
            const hasETA = item.ETA;
            const hasAvion = item.Avion && item.Avion !== ' ';
            const hasCheckIn = !!item.CheckIn && item.NroVuelo !== 'GUA';
            const hasCheckOut = !!item.CheckOut && item.NroVuelo !== 'GUA';
            const hasNroVuelo = item.NroVuelo && item.NroVuelo !== ' ';
            const hasCrew = item.Crew && item.Crew.length > 0; // Verifica si hay información de tripulación

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
                      ? '#fa8072'
                      : getColor(group.date),
                  marginBottom: 0,
                  margin:0,
                }}
              >
                 {/* Columna izquierda: datos del vuelo */} 
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
                          <FontAwesome5 name="chevron-circle-right" size={18} color="black" />
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
                                    // borderRadius:30,

                                     }}>
                        <Text style={{ fontSize: 18,
                                       textAlign:'center',
                                      // padding:3. 
                                       }}>Tiempo de vuelo:</Text>
                     
                      <View style={{flexDirection:'row', justifyContent:'space-around', marginTop:0}}> 
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
                        <FontAwesome5 name="chevron-circle-left" size={18} color="black" />
                      </View>
                    )}    
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
                      ? '#fa8072'
                      : getColor(group.date),}}>
      
      <Ionicons name="people" size={22} color="#191970" />
      <Text style={{ fontSize: 16,
                     marginLeft:4,
                     color:'#191970'}}>
                     {selectedFlight && selectedFlight.index === itemIndex && selectedFlight.date === item.ETD
                     ? 'Tripulación' : 'Tripulación'}
      </Text>
      <MaterialCommunityIcons name={selectedFlight && selectedFlight.index === itemIndex && selectedFlight.date === item.ETD
              ? 'menu-up' 
              : 'menu-down'} size={24} color="#191970" />
      </View>

    {selectedFlight && selectedFlight.index === itemIndex && 
     selectedFlight.date === item.ETD && hasCrew && (
        <View style={Styles.manuCrew}>
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
    onPress={()=>{setShowModal(false), navigation.navigate('Login') }}
           >
      <View style={Styles.botonesMenuInferior}>
      <Feather name="settings" size={20} color="white" />
        <Text style={Styles.txBotones}>CONFIGRACION</Text>
      </View>
    </TouchableOpacity>

    {/* <TouchableOpacity 
    style={{flex:1}}
    onPress={() => {
      webViewRef.current?.injectJavaScript(`
        var roster = document.querySelector('table[id="_tabRoster"]');
        if (roster) {
          var rosterHTML = roster.outerHTML;
          window.ReactNativeWebView.postMessage(rosterHTML);
        }
      `);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Roster actualizado', ToastAndroid.SHORT);
      } else {
        Toast.show('Roster actualizado', { duration: Toast.durations.SHORT });
      }
    }}
           >
      <View style={Styles.botonesMenuInferior}>
        <Text style={Styles.txBotones}>ACTUALIZAR</Text>
        <MaterialIcons name="system-update-tv" size={24} color="white" />
      </View>
    </TouchableOpacity>  */}
  
  </View>  
</View>
</Modal>

      <View style={Styles.webview}>
        <WebView
          isVisiblle={false}
          ref={webViewRef}
          source={{ uri: url }}
          style={{ flex: 1 }}
          onMessage={(event) => {
            const datos = event.nativeEvent.data;
            const processedData = processHTML(datos);
            setRosterData(processedData);

            AsyncStorage.setItem('rosterData', JSON.stringify(processedData)).then(() => {
            }).catch((error) => {
              console.error('Error al guardar RosterData:', error);
            });
          }}
          onLoadEnd={() => {
            console.log('WebView cargado con éxito');
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
          }}
        />
      </View>
    </View>
  );
}

const Styles = StyleSheet.create({

  container: {
    marginTop:'5%',
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
    textTransform: 'uppercase',
    padding: 2,
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
  manuCrew:{
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
    flex:0.6,
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
  //  borderWidth:1,
    marginRight:4,
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 2,
  //  alignSelf:'flex-end',
  },
  checkInContainer:{
  //  borderWidth:1,
    marginLeft:8,
    paddingTop:4,
    alignSelf:'center',
    flexDirection:'row',
    alignContent:'center',
    alignItems:'center',
  },
  checkOutContainer: {
    flexDirection:'row',
 //  borderWidth:2,
  //  marginLeft:22, 
    justifyContent:'center',
  //  position:'absolute',
    bottom:'0%',
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
  });