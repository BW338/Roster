import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Fontisto, FontAwesome, FontAwesome5, MaterialIcons, Ionicons, Feather, MaterialCommunityIcons  } from '@expo/vector-icons';

export default function RosterScreen({ route }) {
  const { groupedRosterData, currentDate } = route.params; 

  return (
    <View style={{ flex: 1 }}>
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
    onPress={() => setShowModal(false)}
           >
      <View style={Styles.botonesMenuInferior}>
      <Feather name="settings" size={20} color="white" />
        <Text style={Styles.txBotones}>CONFIGRACION</Text>
      </View>
    </TouchableOpacity>

    <TouchableOpacity 
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
    </TouchableOpacity> 
  
  </View>  
</View>
    </View>
  );
}
const Styles = StyleSheet.create({

    container:{
      flex: 1,
      borderWidth:1,
      borderRadius:20,
      backgroundColor:'#e6e6fa', 
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