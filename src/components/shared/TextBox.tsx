import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
// import { TextInput } from 'react-native-gesture-handler'
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';



type TextBoxProps = {
  IconTitle: React.ComponentType<any>;
  IconName: string;
  title: string;
  placeholder: string;
  size: number;
  value: string;
  onChangeText: (text: string) => void;
};

const TextBox: React.FC<TextBoxProps> = ({ IconTitle, IconName, title, placeholder, size, value, onChangeText }) => {

  const keyboardType = title === 'Phone Number' ? 'numeric' : 'default';
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Handle date picker visibility
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  // Handle date selection
  const handleConfirm = (date: Date) => {
    onChangeText(moment(date).format('YYYY-MM-DD')); // Format the date as needed
    hideDatePicker();
  };

  return (
    <View style={styles.textBoxContainer}>
      <View style={styles.iconContainer}>
        <IconTitle name={IconName} size={size} color="#000" />
      </View>
      <View style={styles.textArea}>
        <Text>{title}</Text>
        <TouchableOpacity
          onPress={() => {
            if (title === 'Dob') {
              showDatePicker();
            }
          }}
          disabled={title !== 'Dob'}
        >
          <TextInput
            style={{ borderBottomWidth: 1, borderBottomColor: '#6b6b6b' }}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            editable={title !== 'Dob'}
            pointerEvents={title === 'Dob' ? 'none' : 'auto'}
          />
        </TouchableOpacity>
      </View>
      {title === 'Dob' && (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          minimumDate={new Date(1900, 0, 1)} // Jan 1, 1900
          maximumDate={new Date()}
        />
      )}
    </View>
  )
}

export default TextBox

const styles = StyleSheet.create({
  textBoxContainer: {
    // backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    borderColor: '#f1f1f1',
    marginBottom: 20
  },
  iconContainer: {
    width: '20%',
  },
  textArea: {
    width: '80%'
  }
})