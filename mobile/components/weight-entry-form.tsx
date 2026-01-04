import { StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Txt from './text'
import { formatDate } from '../functions/formatted-date'
import {
  Modal,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import tw from '../tw'
import Button from './button'
import SFIcon from './sf-icon'
import Colors from '../constants/colors'
import SafeView from './safe-view'

const WeightEntryForm = () => {
  const [data, setData] = useState({
    weight: 1,
    date: new Date(), // disable future dates
  })
  const [weightText, setWeightText] = useState('1.0')
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const getWeightData = async () => {
    // fetch weight data
    // { previousEntry: { weight: number, date: string, difference?: number } }
    // if previous entry date is today, tell user it will overwrite existing entry
  }

  useEffect(() => {
    getWeightData()
  }, [])

  return (
    <>
      <View>
        <Txt twcn="text-xl font-semibold mb-1">Log Weight</Txt>
        <Button onPress={() => setIsDatePickerOpen(true)}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-medium tracking-wide">
            {formatDate(data.date)}
          </Txt>
        </Button>
        <View style={tw`mt-12 flex-row gap-8 self-center items-center`}>
          <Button
            onPress={() => {
              const newWeight = Math.max(
                1,
                Math.round((data.weight - 0.1) * 10) / 10
              )
              setData((prevData) => ({
                ...prevData,
                weight: newWeight,
              }))
              setWeightText(newWeight.toFixed(1))
            }}
          >
            <SFIcon
              name="minus"
              size={48}
              color={Colors.red}
            />
          </Button>
          <TextInput
            style={tw`text-4xl font-black text-center text-light-text dark:text-dark-text min-w-32`}
            keyboardType="decimal-pad"
            value={weightText}
            onChangeText={(text) => {
              // Allow typing but don't update data if out of range
              setWeightText(text)
              const numericValue = parseFloat(text)
              if (
                !isNaN(numericValue) &&
                numericValue >= 1 &&
                numericValue <= 400
              ) {
                setData((prevData) => ({
                  ...prevData,
                  weight: numericValue,
                }))
              }
            }}
            onBlur={() => {
              // Round to nearest 0.1 and clamp between 1 and 400
              const numericValue = parseFloat(weightText)
              const rounded =
                Math.round((isNaN(numericValue) ? 1 : numericValue) * 10) / 10
              const clamped = Math.min(400, Math.max(1, rounded))
              setData((prevData) => ({
                ...prevData,
                weight: clamped,
              }))
              setWeightText(clamped.toFixed(1))
            }}
            selectTextOnFocus
            maxLength={5}
          />
          <Button
            onPress={() => {
              const newWeight = Math.min(
                400,
                Math.round((data.weight + 0.1) * 10) / 10
              )
              setData((prevData) => ({
                ...prevData,
                weight: newWeight,
              }))
              setWeightText(newWeight.toFixed(1))
            }}
          >
            <SFIcon
              name="plus"
              size={48}
              color={Colors.green}
            />
          </Button>
        </View>
      </View>
      <Modal
        visible={isDatePickerOpen}
        transparent
        animationType="fade"
      >
        <Pressable
          style={tw`flex-1 justify-center items-center bg-black/50`}
          onPress={() => setIsDatePickerOpen(false)}
        >
          <TouchableWithoutFeedback>
            <View
              style={tw`bg-light-background dark:bg-dark-background rounded-2xl p-3 shadow-lg`}
            >
              <DateTimePicker
                value={data.date}
                mode="date"
                maximumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    // Check if the selected date is in the future
                    const today = new Date()
                    today.setHours(0, 0, 0, 0) // Reset time to start of day
                    const newDate = new Date(selectedDate)
                    newDate.setHours(0, 0, 0, 0)
                    setData((prevData) => ({
                      ...prevData,
                      date: newDate > today ? today : newDate,
                    }))
                  }

                  // Close immediately on Android after selection
                  if (Platform.OS === 'android') {
                    setIsDatePickerOpen(false)
                  }
                }}
              />
              {Platform.OS === 'ios' && (
                <Button
                  text="Done"
                  onPress={() => setIsDatePickerOpen(false)}
                  twcn="mt-2 bg-primary rounded-xl p-3"
                  twcnText="text-center font-semibold text-dark-text"
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>
    </>
  )
}

export default WeightEntryForm

const styles = StyleSheet.create({})
