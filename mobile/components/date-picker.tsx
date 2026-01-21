import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native'
import React from 'react'
import tw from '../tw'
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import Colors from '../constants/colors'
import Button from './button'

type DatePickerProps = {
  isOpen: boolean
  closePicker: () => void
  value: Date
  onChange: (event: DateTimePickerEvent, date: Date | undefined) => void
  disableFutureDates?: boolean
}

const MyDatePicker = ({
  isOpen,
  closePicker,
  value,
  onChange,
  disableFutureDates = false,
}: DatePickerProps) => {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
    >
      <Pressable
        style={tw`flex-1 justify-center items-center bg-black/50`}
        onPress={closePicker}
      >
        <TouchableWithoutFeedback>
          <View
            style={tw`bg-light-background dark:bg-dark-background rounded-2xl p-3 shadow-lg`}
          >
            <DateTimePicker
              accentColor={Colors.primary}
              value={value}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChange}
              maximumDate={disableFutureDates ? new Date() : undefined}
            />
            {Platform.OS === 'ios' && (
              <Button
                text="Done"
                onPress={closePicker}
                twcn="mt-2 bg-primary rounded-full p-3"
                twcnText="text-center font-semibold text-dark-text"
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  )
}

export default MyDatePicker

const styles = StyleSheet.create({})
