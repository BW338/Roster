import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, Alert, Modal, Text, ScrollView, Toast, ToastAndroid, Platform, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import cheerio from 'cheerio';
import { Fontisto, FontAwesome, FontAwesome5, Entypo, Ionicons, Feather, MaterialIcons  } from '@expo/vector-icons';

const currentDate = new Date(); // Obtiene la fecha actual


export default function App() {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const webViewRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [rosterData, setRosterData] = useState(null);
  const today = new Date();
  const [crewData, setCrewData] = useState([]);
  const [isCrewVisible, setIsCrewVisible] = useState(false);

  const toggleCrewVisibility = () => {
    setIsCrewVisible(!isCrewVisible);
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
      const savedPassword = await AsyncStorage.getItem('password');
      const savedRosterData = await AsyncStorage.getItem('rosterData');

      if (savedUrl) {
        setUrl(savedUrl);
      }
      if (savedUsername) {
        setUsername(savedUsername);
      }
      if (savedPassword) {
        setPassword(savedPassword);
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
      await AsyncStorage.setItem('password', password);

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
    if (url && username && password) {
      webViewRef.current?.reload();
    }
  }, [url, username, password]);

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
  
  
  const groupedCrewData = groupCrewDataByDay(crewData); // Reemplaza 'crewData' con tus datos reales de la tripulación
  // console.log('Datos de la tripulación agrupados por fecha:', groupedCrewData); // Muestra los datos agrupados
  // console.log('Datos de la tripulación extraídos:', crewData);

 
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
  
  // Crea una instancia de la función getColorByDate
  const getColor = getColorByDate();
  
  
  return (
    <View style={{ flex: 1, marginHorizontal: '4%', marginTop: '8%'}}>
      <TextInput
        placeholder="Dirección URL"
        value={url}
        onChangeText={(text) => setUrl(text)}
      />
      <TextInput
        placeholder="Nombre de Usuario"
        value={username}
        onChangeText={(text) => setUsername(text)}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={(text) => setPassword(text)}
      />

    <Button 
    title="Guardar datos" 
    onPress={saveConfig} />
 
      <Button
        title="Ingresar"
        onPress={() => {
   //       console.log('Llamando a injectJavaScript');
          webViewRef.current?.injectJavaScript(`
            var usernameInput = document.querySelector('input[id="_login_ctrlUserName"]');
            var passwordInput = document.querySelector('input[id="_login_ctrlPassword"]');
            if (usernameInput && passwordInput) {
              usernameInput.value = '${username}';
              passwordInput.value = '${password}';
              var loginButton = document.querySelector('input[id="_login_btnLogin"]');
              if (loginButton) {
                loginButton.click();
              }
            }
          `);
        }}
      />
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
      <Button
        title="Ver Roster"
        onPress={() => {
          setShowModal(true);
        //  console.log('******' + todayDateString);
        }}
      />

<Modal
  visible={showModal}
  animationType="slide"
  onRequestClose={() => setShowModal(false)}
>
  <View style={{ flex: 1 }}>
    <Text style={{
      borderWidth: 1,
      borderColor: '#40e0d0',
      color: 'white',
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: 32,
      textTransform: 'uppercase',
      padding: 2,
      paddingVertical: 6,
      borderRadius: 20,
      marginHorizontal: '4%',
      marginTop: '0%',
      marginVertical: 6,
      fontWeight: 'bold',
      backgroundColor: `#4682b4`
    }}>
      ROSTER
    </Text>

    <ScrollView style={{ flex: 1 }}>
      {groupedRosterData.map((group, index) => (
        <View key={index}>
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
            if (
              !item.CheckIn &&
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
           
            if (
              (!item.CheckIn && !item.NroVuelo && !item.Dep && !item.Arr && !item.ETD && !item.ETA && !item.CheckOut && !item.Avion) &&
              (!hasCrew || (hasCrew && item.Crew.every(crewMember => !crewMember.Name)))
            ) {
              return null; // Evitar renderizar elementos vacíos
            }
    
            return (
              <View
                key={itemIndex}
                style={{
                  flex: 1,
                  width:'100%',
                  flexDirection: 'row', // Esto coloca los elementos en fila
                  borderWidth: 1,
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
 
                  <View style={{ flex: 1, borderColor:'black', marginLeft:6}} id={'datosVuelo'}>
                    <View style={{ flexDirection: 'column' }}>
                      {hasCheckIn && (
                        <Text style={{ fontWeight: 'bold', fontSize: 16, paddingVertical: 8 }}>
                          {formatCheckIn(item.CheckIn)}
                        </Text>
                      )}
                      {hasNroVuelo && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                          {item.NroVuelo === 'VAC' ? (
                            <>
                              <Fontisto name="holiday-village" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>VAC</Text>
                            </>
                          ) : item.NroVuelo === '*'  ? (
                            <>
                              <FontAwesome name="home" size={24} color="black" />
                              <Text style={{ fontSize: 16, marginLeft: 8 }}>DIA OFF</Text>
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
                              <Ionicons name="ios-home-outline" size={24} color="black" />
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
                      </View>
                    )}
                    {hasETD && hasETA && (
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={{ fontSize: 18 }}>{extractTime(item.ETD)}</Text>
                        <Text style={{ fontSize: 18 }}> - {extractTime(item.ETA)} </Text>
                      </View>
                    )}
                    {hasCheckOut && (
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', paddingVertical: 2 }}>
                          CheckOut {extractTime(item.CheckOut)}
                        </Text>
                      </View>
                    )}
                    {hasAvion && (
                      <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
                        <Ionicons name="airplane" size={18} color="black" />
                        <Text> {item.Avion} </Text>
                      </View>
                    )}
                    {/* <Text>PRUEBA</Text> */}
                  </View>)}

                {/* Columna derecha: información de la tripulación */}
      {hasCrew && (
  <View style={{ flex: 1, borderColor: 'black', paddingLeft:0}}>
    <TouchableOpacity
      onPress={() => toggleCrewVisibility()}
    >
      <View style={{ flexDirection: 'row',
                     backgroundColor: '#ffefd5',
                     alignContent:'center',
                     justifyContent:'center',
                     borderWidth:0.1,
                     }}>
        <MaterialIcons name="person-search" size={24} color="black" />
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
          {isCrewVisible ? 'Tripulacion' : 'Tripulacion'}
        </Text>
        <Entypo name={isCrewVisible ? 'triangle-up' : 'triangle-down'} size={18} color="black" />
      </View>
    
    {isCrewVisible && (
      <View style={{alignContent:'center',
                    backgroundColor: '#ffefd5',
                    paddingLeft:6}}>
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

    <Button
      title="Configuración"
      onPress={() => setShowModal(false)}
    />
  </View>
</Modal>

      <View style={{ flex: 1, borderWidth: 0.3, borderColor: 'black' }}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={{ flex: 1 }}
          onMessage={(event) => {
            const datos = event.nativeEvent.data;
          //  console.log('Datos recibidos desde el WebView:', datos);
            const processedData = processHTML(datos);
            setRosterData(processedData);
          //  console.log('ROSTER DATA:', processedData);

          //  console.log('Contenido del Modal:', datos);

            AsyncStorage.setItem('rosterData', JSON.stringify(processedData)).then(() => {
          //    console.log('RosterData guardado en el almacenamiento local.');
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