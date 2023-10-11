import React, { } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeStack from './Routes/HomeStack';

export default function App() {

  return (
    <View style={styles.container}>
      <HomeStack></HomeStack> 

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
