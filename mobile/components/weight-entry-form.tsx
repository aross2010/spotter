import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  Alert,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import Txt from './text'
import { formatDate, toLocalDateString } from '../functions/formatted-date'
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
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { GlassView } from 'expo-glass-effect'
import { useUserStore } from '../stores/user-store'
import Spinner from './activity-indicator'
import { useAuth } from '../context/auth-context'
import { BASE_URL } from '../constants/auth'
import MyDatePicker from './date-picker'
import { useBodyWeightStore } from '../stores/body-weight-store'

type PreviousWeightEntry = {
  weight: number
  date: string
  id: string
  difference?: number
}

type WeightEntryFormProps = {
  closeModal?: () => void
}

// helper to format data.date to compare
const formatYYYYMMDD = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const WeightEntryForm = ({ closeModal }: WeightEntryFormProps) => {
  const [previousEntry, setPreviousEntry] =
    useState<PreviousWeightEntry | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { fetchWithAuth } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { preferences, user } = useUserStore()
  const { triggerRefresh } = useBodyWeightStore()
  const weightUnit = preferences?.weightMetric ?? 'lbs' // 'lbs' or 'kgs'
  const [data, setData] = useState({
    weight: 200,
    date: new Date(), // disable future dates
    metric: weightUnit,
  })
  const [weightText, setWeightText] = useState('200.0')
  const formattedDataDate = formatYYYYMMDD(data.date)

  const identicalDate = previousEntry?.date === formattedDataDate

  const getWeightData = async () => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/weightEntries/previous/${user?.id}?unit=${weightUnit}&date=${toLocalDateString(data.date)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      const previousEntry = (await response.json()) as PreviousWeightEntry
      setPreviousEntry(previousEntry)
      setData((prevData) => ({
        ...prevData,
        weight: previousEntry ? previousEntry.weight : 200,
      }))
      setWeightText(previousEntry ? previousEntry.weight.toFixed(1) : '200.0')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
    // fetch weight data
    // { previousEntry: { weight: number, date: string, difference?: number } }
    // if previous entry date is today, tell user it will overwrite existing entry
  }

  const handleSubmitEntry = async () => {
    setIsSaving(true)
    try {
      await fetchWithAuth(`${BASE_URL}/api/weightEntries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: data.weight,
          date: toLocalDateString(data.date),
          metric: data.metric,
        }),
      })
      triggerRefresh()
      setTimeout(() => {
        closeModal?.()
      }, 100)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEntry = async () => {
    Alert.alert(
      `Delete Weight Entry for ${formatDate(data.date)}`,
      'Are you sure you want to delete this weight entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true)
              await fetchWithAuth(
                `${BASE_URL}/api/weightEntries/${previousEntry?.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                },
              )
              triggerRefresh()
              getWeightData()
            } catch (error: any) {
              Alert.alert('Error', error.message)
            } finally {
              setIsDeleting(false)
            }
          },
        },
      ],
    )
  }

  useEffect(() => {
    getWeightData()
  }, [data.date])

  useEffect(() => {
    getWeightData()
  }, [])

  if (loading) return <Spinner twcn="min-h-44" />

  return (
    <>
      <View style={tw`pb-4`}>
        <View style={tw`flex-row justify-between items-center`}>
          <View>
            <Txt twcn="text-xl font-semibold mb-1">
              Log Weight{' '}
              <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                ({weightUnit === 'lbs' ? 'lbs' : 'kg'})
              </Txt>
            </Txt>
            <Button onPress={() => setIsDatePickerOpen(true)}>
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-medium tracking-wide">
                {formatDate(data.date)}
              </Txt>
            </Button>
          </View>
          <View style={tw`flex-row items-center gap-4`}>
            {identicalDate && (
              <GlassView
                style={tw`rounded-full px-2 flex-row items-center justify-center h-12 w-12`}
              >
                {isDeleting ? (
                  <Spinner
                    twcn="w-8"
                    fullScreen={false}
                  />
                ) : (
                  <Button
                    onPress={handleDeleteEntry}
                    disabled={isSaving}
                  >
                    <SFIcon
                      name="trash"
                      size={28}
                      color={Colors.primary}
                    />
                  </Button>
                )}
              </GlassView>
            )}

            <GlassView
              style={tw`rounded-full px-2 flex-row items-center justify-center h-12 w-12`}
            >
              {isSaving ? (
                <Spinner
                  twcn="w-8"
                  fullScreen={false}
                />
              ) : (
                <Button
                  onPress={handleSubmitEntry}
                  disabled={isDeleting}
                >
                  <SFIcon
                    name="checkmark"
                    size={28}
                    color={Colors.primary}
                  />
                </Button>
              )}
            </GlassView>
          </View>
        </View>
        <View style={tw`mt-12 flex-row gap-8 self-center items-center`}>
          <Button
            onPress={() => {
              const newWeight = Math.max(
                1,
                Math.round((data.weight - 0.1) * 10) / 10,
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
          <BottomSheetTextInput
            autoFocus={true}
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
            editable={!isSaving}
          />
          <Button
            onPress={() => {
              const newWeight = Math.min(
                400,
                Math.round((data.weight + 0.1) * 10) / 10,
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
        <View style={tw`mt-6`}>
          {previousEntry && (
            <>
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                Previous: {previousEntry.weight} {weightUnit},{' '}
                {formatDate(previousEntry.date)}
                {previousEntry.difference !== undefined &&
                  previousEntry.difference !== null && (
                    <Txt
                      twcn={`text-xs ${
                        previousEntry.difference < 0
                          ? 'text-red'
                          : previousEntry.difference > 0
                            ? 'text-green'
                            : 'text-light-grayText dark:text-dark-grayText'
                      }`}
                    >
                      {' '}
                      ({previousEntry.difference >= 0 ? '+' : ''}
                      {previousEntry.difference} {weightUnit})
                    </Txt>
                  )}
                {identicalDate &&
                  '. This entry will overwrite your existing entry for this date.'}
              </Txt>
            </>
          )}
        </View>
      </View>

      <MyDatePicker
        value={data.date}
        isOpen={isDatePickerOpen}
        closePicker={() => setIsDatePickerOpen(false)}
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
        disableFutureDates
      />
    </>
  )
}

export default WeightEntryForm

const styles = StyleSheet.create({})
