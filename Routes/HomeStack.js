import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../Screens/Splash';
import Roster from '../Screens/Roster';
import App from '../App';
import Login from "../Screens/Login";

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash" // ruta inicial
        screenOptions={{ headerShown: false }} 
      >
        <Stack.Screen name="App" component={App} />
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Roster" component={Roster} />
        <Stack.Screen name="Login" component={Login} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default HomeStack;