import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const CustomCheckBox = ({ label, checked, onChange }) => {
  return (
    <TouchableOpacity onPress={() => onChange(!checked)}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderWidth: 2,
            borderColor: 'blue',
            borderRadius: 5,
            marginRight: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {checked && (
            <View
              style={{
                width: 16,
                height: 16,
                backgroundColor: 'blue',
                borderRadius: 3,
              }}
            />
          )}
        </View>
        <Text>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CustomCheckBox;
