import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, Alert, Modal, Text, ScrollView, Toast, ToastAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import cheerio from 'cheerio';

export default function App() {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const webViewRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [rosterData, setRosterData] = useState(null);
  const today = new Date();
  const todayDateString = today.toDateString();

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

    // Selecciona y extrae filas con las clases "RosterOddRow" y "RosterEvenRow" dentro de la tabla HTML
    $('table[id="_tabRoster"] tr.RosterOddRow, table[id="_tabRoster"] tr.RosterEvenRow').each((index, element) => {
      // Verifica si la fila contiene el componente RosterRowCheckin
      const hasCheckin = $(element).find('td.RosterRowCheckin').length > 0;

      // Si no tiene RosterRowCheckin, saltea esta fila
      if (!hasCheckin) {
        return;
      }

      const rowData = {};

      // Selecciona y extrae datos de cada celda de la fila con clases específicas
      rowData.CheckIn = $(element).find('td.RosterRowCheckin').text();
      rowData.NroVuelo = $(element).find('td.RosterRowActivity').text();
      rowData.ETD = $(element).find('td.RosterRowStart').text();
      rowData.Dep = $(element).find('td.RosterRowDep').text();
      rowData.Arr = $(element).find('td.RosterRowArr').text();
      rowData.ETA = $(element).find('td.RosterRowEnd').text();
      rowData.CheckOut = $(element).find('td.RosterRowCheckout').text();
      rowData.Avion = $(element).find('td.RosterRowAcType').text();

      extractedData.push(rowData);
    });

    return extractedData;
  };

  const groupDataByDay = (data) => {
    const groupedData = {};

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const itemDate = new Date(item.columna3).toDateString();

        if (!groupedData[itemDate]) {
          groupedData[itemDate] = [];
        }

        groupedData[itemDate].push(item);
      });
    }

    return groupedData;
  };

  const groupedRosterData = groupDataByDay(rosterData);

  return (
    <View style={{ flex: 1, marginHorizontal: '4%', marginTop: '8%' }}>
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

      <Button title="Guardar datos" onPress={saveConfig} />
      <Button
        title="Ingresar"
        onPress={() => {
          console.log('Llamando a injectJavaScript');
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
          console.log('******' + todayDateString);
        }}
      />

      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Text style={{ textAlign: 'center', fontSize: 23 }}>ROSTER</Text>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {Object.keys(groupedRosterData).map((date, index) => (
              <View key={index}>
                <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>{date}</Text>
                {groupedRosterData[date].map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    style={{
                      flex: 1,
                      margin: 2,
                      padding: 3,
                      borderWidth: 1,
                      borderColor: 'grey',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      alignContent: 'space-around',
                    }}
                  >
                    <Text>{item.CheckIn}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      <Text>{item.ETD} </Text>
                      <Text>{item.NroVuelo} </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <Text>{item.Dep} </Text>
                      <Text>{item.Arr} </Text>
                      <Text>{item.ETA} </Text>
                    </View>
                    <Text>{item.CheckOut} </Text>
                    <Text>{item.Avion} </Text>
                  </View>
                ))}
              </View>
            ))}
            <Button
              title="Cerrar Modal"
              onPress={() => setShowModal(false)}
            />
          </View>
        </ScrollView>
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
              console.log('RosterData guardado en el almacenamiento local.');
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
