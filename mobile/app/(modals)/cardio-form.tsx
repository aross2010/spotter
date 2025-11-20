import { View, ScrollView, Alert, Animated, TextInput } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import tw from '../../tw'
import { cardioMachines } from '../../constants/data'
import Button from '../../components/button'
import { SymbolView } from 'expo-symbols'
import Colors from '../../constants/colors'
import { router, useNavigation, useLocalSearchParams } from 'expo-router'
import Input from '../../components/input'
import { useWorkoutForm } from '../../context/workout-form-context'
import {
  CardioEntry,
  TreadmillEntry,
  BikeEntry,
  StairClimberEntry,
} from '../../utils/types'
import useTheme from '../hooks/theme'

type CardioMachine = (typeof cardioMachines)[number]

const CardioForm = () => {
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { theme, colorScheme } = useTheme()
  const navigation = useNavigation()
  const { editIndex } = useLocalSearchParams<{ editIndex?: string }>()

  // Form state
  const [selectedMachine, setSelectedMachine] = useState<CardioMachine | null>(
    null
  )
  const [timing, setTiming] = useState<'before' | 'after' | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  // Duration state (HH:MM:SS)
  const [hours, setHours] = useState<string>('')
  const [minutes, setMinutes] = useState<string>('')
  const [seconds, setSeconds] = useState<string>('')

  // Animation
  const machineHeight = useRef(new Animated.Value(0)).current
  const timingHeight = useRef(new Animated.Value(0)).current
  const detailsHeight = useRef(new Animated.Value(0)).current
  const detailsOpacity = useRef(new Animated.Value(0)).current

  const distanceUnit = workoutData.distanceUnit === 'mi' ? 'Mi' : 'Km'
  const speedUnit = workoutData.distanceUnit === 'mi' ? 'mph' : 'kph'

  // Calculate duration in seconds
  const getDurationSeconds = (): number => {
    const h = parseInt(hours) || 0
    const m = parseInt(minutes) || 0
    const s = parseInt(seconds) || 0
    return h * 3600 + m * 60 + s
  }

  const isFormValid = selectedMachine && timing && getDurationSeconds() > 0

  // Check if a machine already has cardio entries at both start and end
  const isMachineFullyBooked = (machineName: string): boolean => {
    if (!workoutData.cardioEntries || workoutData.cardioEntries.length === 0)
      return false

    const editingIndex = editIndex !== undefined ? parseInt(editIndex, 10) : -1

    const machineEntries = workoutData.cardioEntries.filter(
      (entry, idx) => entry.machineId === machineName && idx !== editingIndex
    )

    const hasStart = machineEntries.some((entry) => entry.startOfWorkout)
    const hasEnd = machineEntries.some((entry) => entry.endOfWorkout)

    return hasStart && hasEnd
  }

  // Check if a timing option is already taken for a specific machine
  const isTimingDisabledForMachine = (
    machineName: string,
    timingOption: 'before' | 'after'
  ): boolean => {
    if (!workoutData.cardioEntries) return false

    const editingIndex = editIndex !== undefined ? parseInt(editIndex, 10) : -1

    return workoutData.cardioEntries.some(
      (entry, idx) =>
        idx !== editingIndex &&
        entry.machineId === machineName &&
        ((timingOption === 'before' && entry.startOfWorkout) ||
          (timingOption === 'after' && entry.endOfWorkout))
    )
  }

  // Check if a timing option is already taken for the selected machine
  const isTimingDisabled = (timingOption: 'before' | 'after'): boolean => {
    if (!selectedMachine) return false
    return isTimingDisabledForMachine(selectedMachine.name, timingOption)
  }

  // Load existing entry data when editing
  useEffect(() => {
    if (editIndex !== undefined && workoutData.cardioEntries) {
      const index = parseInt(editIndex, 10)
      const entry = workoutData.cardioEntries[index]

      if (entry) {
        // Find the machine
        const machine = cardioMachines.find((m) => m.name === entry.machineId)
        if (machine) {
          setSelectedMachine(machine)
        }

        // Set timing
        setTiming(entry.startOfWorkout ? 'before' : 'after')

        // Set duration
        const duration = entry.entryData.duration
        const h = Math.floor(duration / 3600)
        const m = Math.floor((duration % 3600) / 60)
        const s = duration % 60
        setHours(h > 0 ? h.toString() : '')
        setMinutes(m > 0 ? m.toString() : '')
        setSeconds(s > 0 ? s.toString() : '')

        // Set form data based on machine type
        const data: Record<string, string> = {}
        if ('distanceMiles' in entry.entryData) {
          const distance =
            workoutData.distanceUnit === 'mi'
              ? entry.entryData.distanceMiles
              : entry.entryData.distanceKm
          if (distance > 0) data.distance = distance.toString()
        }
        if ('averageSpeedMph' in entry.entryData) {
          const speed =
            workoutData.distanceUnit === 'mi'
              ? entry.entryData.averageSpeedMph
              : entry.entryData.averageSpeedKph
          if (speed > 0) data.speed = speed.toString()
        }
        if (
          'averageIncline' in entry.entryData &&
          entry.entryData.averageIncline > 0
        ) {
          data.incline = entry.entryData.averageIncline.toString()
        }
        if (
          'averageResistanceLevel' in entry.entryData &&
          entry.entryData.averageResistanceLevel > 0
        ) {
          data.resistanceLevel =
            entry.entryData.averageResistanceLevel.toString()
        }
        if ('level' in entry.entryData && entry.entryData.level > 0) {
          data.level = entry.entryData.level.toString()
        }
        if (
          'stepsClimbed' in entry.entryData &&
          entry.entryData.stepsClimbed > 0
        ) {
          data.stepsClimbed = entry.entryData.stepsClimbed.toString()
        }
        if (entry.entryData.caloriesBurned > 0) {
          data.caloriesBurned = entry.entryData.caloriesBurned.toString()
        }

        setFormData(data)
      }
    }
  }, [editIndex, workoutData.cardioEntries])

  // Set up header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: editIndex !== undefined ? 'Edit Cardio' : 'Add Cardio',
      headerRight: () => (
        <Button
          onPress={handleSave}
          hitSlop={12}
          disabled={!isFormValid}
          twcnText={`font-poppinsSemiBold ${isFormValid ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
          text={editIndex !== undefined ? 'Update' : 'Save'}
        />
      ),
    })
  }, [
    isFormValid,
    selectedMachine,
    timing,
    hours,
    minutes,
    seconds,
    formData,
    editIndex,
  ])

  // Animate sections
  useEffect(() => {
    // Always show machine selection
    Animated.timing(machineHeight, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
    if (selectedMachine) {
      Animated.timing(timingHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(timingHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [selectedMachine])

  useEffect(() => {
    if (timing && selectedMachine) {
      Animated.parallel([
        Animated.timing(detailsHeight, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(detailsHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(detailsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [timing, selectedMachine])

  const handleMachineSelect = (machine: CardioMachine) => {
    // Don't allow selecting a machine that's fully booked
    if (isMachineFullyBooked(machine.name)) return

    if (selectedMachine?.name === machine.name) {
      // Deselect
      setSelectedMachine(null)
      setTiming(null)
      setFormData({})
    } else {
      setSelectedMachine(machine)
      // Reset timing if the previously selected timing is now disabled for this new machine
      if (timing && isTimingDisabledForMachine(machine.name, timing)) {
        setTiming(null)
      }
    }
  }

  const handleTimingSelect = (selectedTiming: 'before' | 'after') => {
    // Don't allow selecting a disabled timing option
    if (isTimingDisabled(selectedTiming)) return

    if (timing === selectedTiming) {
      setTiming(null)
    } else {
      setTiming(selectedTiming)
    }
  }

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleTimeInput = (
    type: 'hours' | 'minutes' | 'seconds',
    value: string
  ) => {
    // Remove non-numeric characters
    const cleaned = value.replace(/[^0-9]/g, '')

    // Allow empty string for better UX while typing
    if (cleaned === '') {
      if (type === 'hours') {
        setHours('')
      } else if (type === 'minutes') {
        setMinutes('')
      } else {
        setSeconds('')
      }
      return
    }

    const numValue = parseInt(cleaned, 10)

    if (type === 'hours') {
      // Hours: 0-23, no padding
      setHours(Math.min(numValue, 23).toString())
    } else if (type === 'minutes') {
      // Minutes: 0-59
      setMinutes(Math.min(numValue, 59).toString())
    } else {
      // Seconds: 0-59
      setSeconds(Math.min(numValue, 59).toString())
    }
  }

  const parseNumber = (value: string): number => {
    const num = parseFloat(value)
    return isNaN(num) ? 0 : num
  }

  const convertSpeed = (
    value: number,
    fromUnit: 'mph' | 'kph'
  ): { mph: number; kph: number } => {
    if (fromUnit === 'mph') {
      return { mph: value, kph: value * 1.60934 }
    } else {
      return { mph: value / 1.60934, kph: value }
    }
  }

  const convertDistance = (
    value: number,
    fromUnit: 'mi' | 'km'
  ): { miles: number; km: number } => {
    if (fromUnit === 'mi') {
      return { miles: value, km: value * 1.60934 }
    } else {
      return { miles: value / 1.60934, km: value }
    }
  }

  const handleSave = () => {
    if (!selectedMachine || !timing) return

    const durationSeconds = getDurationSeconds()
    if (durationSeconds === 0) {
      Alert.alert('Duration Required', 'Please enter a duration.')
      return
    }

    let entryData: TreadmillEntry | BikeEntry | StairClimberEntry

    if (selectedMachine.name === 'Treadmill') {
      const distance = convertDistance(
        parseNumber(formData.distance || '0'),
        workoutData.distanceUnit
      )
      const speed = convertSpeed(
        parseNumber(formData.speed || '0'),
        workoutData.distanceUnit === 'mi' ? 'mph' : 'kph'
      )

      entryData = {
        duration: durationSeconds,
        distanceMiles: distance.miles,
        distanceKm: distance.km,
        averageSpeedMph: speed.mph,
        averageSpeedKph: speed.kph,
        averageIncline: parseNumber(formData.incline || '0'),
        caloriesBurned: parseNumber(formData.caloriesBurned || '0'),
      } as TreadmillEntry
    } else if (selectedMachine.name === 'Stationary Bike') {
      const distance = convertDistance(
        parseNumber(formData.distance || '0'),
        workoutData.distanceUnit
      )
      const speed = convertSpeed(
        parseNumber(formData.speed || '0'),
        workoutData.distanceUnit === 'mi' ? 'mph' : 'kph'
      )

      entryData = {
        duration: durationSeconds,
        distanceMiles: distance.miles,
        distanceKm: distance.km,
        averageSpeedMph: speed.mph,
        averageSpeedKph: speed.kph,
        averageResistanceLevel: parseNumber(formData.resistanceLevel || '0'),
        caloriesBurned: parseNumber(formData.caloriesBurned || '0'),
      } as BikeEntry
    } else {
      entryData = {
        duration: durationSeconds,
        stepsClimbed: parseNumber(formData.stepsClimbed || '0'),
        caloriesBurned: parseNumber(formData.caloriesBurned || '0'),
        level: parseNumber(formData.level || '0'),
      } as StairClimberEntry
    }

    const newEntry: CardioEntry = {
      machineId: selectedMachine.name,
      entryData,
      ...(timing === 'before' && { startOfWorkout: true }),
      ...(timing === 'after' && { endOfWorkout: true }),
    }

    if (editIndex !== undefined) {
      // Update existing entry
      const index = parseInt(editIndex, 10)
      const updatedEntries = [...(workoutData.cardioEntries || [])]
      updatedEntries[index] = newEntry
      setWorkoutData({
        ...workoutData,
        cardioEntries: updatedEntries,
      })
    } else {
      // Add new entry
      setWorkoutData({
        ...workoutData,
        cardioEntries: [...(workoutData.cardioEntries || []), newEntry],
      })
    }

    // Navigate back to workout form
    router.back()
  }

  const getFieldLabel = (field: any) => {
    return field.label
  }

  const getFieldUnit = (field: any) => {
    if (field.name === 'distance') return distanceUnit
    if (field.name === 'speed') return speedUnit
    if (field.name === 'incline') return '%'
    if (field.name === 'caloriesBurned') return 'kcal'
    return null
  }

  return (
    <SafeView
      keyboardAvoiding
      twcnContentView="gap-6"
      keyboardShouldPersistTaps="handled"
      bottomOffset={175}
    >
      {/* Section 1: Machine Selection */}
      <Animated.View style={{ opacity: machineHeight }}>
        <View style={tw`gap-3`}>
          <Txt twcn="text-base font-poppinsSemiBold">Select Machine</Txt>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {cardioMachines.map((machine) => {
              const isDisabled = isMachineFullyBooked(machine.name)
              return (
                <Button
                  key={machine.name}
                  onPress={() => handleMachineSelect(machine)}
                  disabled={isDisabled}
                  twcn={`flex-row items-center gap-2 py-1 px-3 rounded-lg border ${
                    selectedMachine?.name === machine.name
                      ? 'bg-primary/10 border-primary'
                      : isDisabled
                        ? 'bg-light-white dark:bg-dark-graySecondary border-light-grayBorder dark:border-dark-grayBorder opacity-50'
                        : 'bg-white dark:bg-dark-grayPrimary border-light-grayBorder dark:border-dark-grayBorder'
                  }`}
                >
                  <SymbolView
                    name={machine.iconName}
                    tintColor={
                      selectedMachine?.name === machine.name
                        ? Colors.primary
                        : isDisabled
                          ? theme.grayText
                          : theme.grayText
                    }
                    style={{ width: 20, height: 20 }}
                  />
                  <Txt
                    twcn={`text-sm font-poppinsMedium ${
                      selectedMachine?.name === machine.name
                        ? 'text-primary dark:text-primary'
                        : isDisabled
                          ? 'text-light-grayText dark:text-dark-grayText'
                          : 'text-light-text dark:text-dark-text'
                    }`}
                  >
                    {machine.name}
                  </Txt>
                </Button>
              )
            })}
          </View>
        </View>
      </Animated.View>

      {/* Section 2: Timing Selection */}
      {selectedMachine && (
        <Animated.View
          style={{
            opacity: timingHeight,
            transform: [{ scaleY: timingHeight }],
          }}
        >
          <View style={tw`gap-3`}>
            <Txt twcn="text-base font-poppinsSemiBold">When?</Txt>
            <View style={tw`flex-row gap-2`}>
              <Button
                onPress={() => handleTimingSelect('before')}
                disabled={isTimingDisabled('before')}
                twcn={`flex-1 py-2 px-4 justify-center items-center rounded-xl flex border ${
                  timing === 'before'
                    ? 'bg-primary/10 border-primary'
                    : isTimingDisabled('before')
                      ? 'bg-light-grayBackground dark:bg-dark-graySecondary border-light-grayBorder dark:border-dark-grayBorder opacity-50'
                      : 'bg-white dark:bg-dark-grayPrimary border-light-grayBorder dark:border-dark-grayBorder'
                }`}
              >
                <Txt
                  twcn={`text-center text-sm font-poppinsMedium ${
                    timing === 'before'
                      ? 'text-primary dark:text-primary'
                      : isTimingDisabled('before')
                        ? 'text-light-grayText dark:text-dark-grayText'
                        : 'text-light-text dark:text-dark-text'
                  }`}
                >
                  Start of Workout
                </Txt>
              </Button>
              <Button
                onPress={() => handleTimingSelect('after')}
                disabled={isTimingDisabled('after')}
                twcn={`flex-1 py-2 px-4 justify-center items-center rounded-xl border ${
                  timing === 'after'
                    ? 'bg-primary/10 border-primary'
                    : isTimingDisabled('after')
                      ? 'bg-light-grayBackground dark:bg-dark-graySecondary border-light-grayBorder dark:border-dark-grayBorder opacity-50'
                      : 'bg-white dark:bg-dark-grayPrimary border-light-grayBorder dark:border-dark-grayBorder'
                }`}
              >
                <Txt
                  twcn={`text-center text-sm font-poppinsMedium ${
                    timing === 'after'
                      ? 'text-primary dark:text-primary'
                      : isTimingDisabled('after')
                        ? 'text-light-grayText dark:text-dark-grayText'
                        : 'text-light-text dark:text-dark-text'
                  }`}
                >
                  End of Workout
                </Txt>
              </Button>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Section 3: Data Fields */}
      {timing && selectedMachine && (
        <Animated.View
          style={{
            opacity: detailsOpacity,
            transform: [{ scaleY: detailsHeight }],
          }}
        >
          <View style={tw`gap-2`}>
            <Txt twcn="text-base font-poppinsSemiBold">Activity Details</Txt>

            {/* Duration Input (HH:MM:SS) */}
            <View
              style={tw`bg-light-grayBackground dark:bg-dark-grayPrimary rounded-xl p-4 border border-light-grayBorder dark:border-dark-grayBorder`}
            >
              <Txt twcn="text-xs font-poppinsMedium text-light-grayText dark:text-dark-grayText mb-3">
                Duration
                <Txt twcn="text-red dark:text-red"> *</Txt>
              </Txt>
              <View style={tw`gap-2`}>
                {/* Inputs row */}
                <View style={tw`flex-row items-start justify-center gap-2`}>
                  <View style={tw`flex-1 gap-2`}>
                    <Input
                      value={hours}
                      onChangeText={(text) => handleTimeInput('hours', text)}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="00"
                      caretHidden={false}
                      textAlign="center"
                      twcnInput="text-light-text dark:text-dark-text text-4xl font-poppinsSemiBold text-center w-full leading-[0]"
                    />
                    <Txt twcn="text-xs font-poppinsMedium text-light-grayText dark:text-dark-grayText text-center">
                      Hours
                    </Txt>
                  </View>

                  <Txt twcn="text-4xl font-poppinsSemiBold text-light-text dark:text-dark-text pt-4">
                    :
                  </Txt>

                  <View style={tw`flex-1 gap-2`}>
                    <Input
                      value={minutes}
                      onChangeText={(text) => handleTimeInput('minutes', text)}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="00"
                      caretHidden={false}
                      textAlign="center"
                      twcnInput="text-light-text dark:text-dark-text text-4xl font-poppinsSemiBold text-center leading-[0]"
                    />
                    <Txt twcn="text-xs font-poppinsMedium text-light-grayText dark:text-dark-grayText text-center">
                      Minutes
                    </Txt>
                  </View>

                  <Txt twcn="text-4xl font-poppinsSemiBold text-light-text dark:text-dark-text pt-4">
                    :
                  </Txt>

                  <View style={tw`flex-1 gap-2`}>
                    <Input
                      value={seconds}
                      onChangeText={(text) => handleTimeInput('seconds', text)}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="00"
                      caretHidden={false}
                      textAlign="center"
                      twcnInput="text-light-text dark:text-dark-text text-4xl font-poppinsSemiBold text-center leading-[0]"
                    />
                    <Txt twcn="text-xs font-poppinsMedium text-light-grayText dark:text-dark-grayText text-center">
                      Seconds
                    </Txt>
                  </View>
                </View>
              </View>
            </View>

            {/* Machine-specific fields */}
            <View style={tw`gap-2`}>
              {selectedMachine.fields
                .filter((field) => field.name !== 'duration')
                .map((field, index) => {
                  const nextField = selectedMachine.fields.filter(
                    (f) => f.name !== 'duration'
                  )[index + 1]
                  const isOdd = index % 2 === 0

                  if (isOdd && nextField) {
                    return (
                      <View
                        key={field.name}
                        style={tw`flex-row gap-2`}
                      >
                        <View
                          style={tw`flex-1 bg-white dark:bg-dark-grayPrimary rounded-xl p-4 border border-light-grayBorder dark:border-dark-grayBorder`}
                        >
                          <Txt twcn="text-xs font-poppinsMedium text-light-grayText dark:text-dark-grayText mb-2">
                            {getFieldLabel(field)}
                          </Txt>
                          <View style={tw`flex-row items-center gap-2 h-16`}>
                            <View style={tw`flex-1`}>
                              <Input
                                value={formData[field.name] || ''}
                                onChangeText={(text) =>
                                  handleInputChange(field.name, text)
                                }
                                keyboardType="numeric"
                                twcnInput="text-light-text dark:text-dark-text text-3xl font-poppinsSemiBold leading-[0]"
                                placeholder="-"
                              />
                            </View>
                            {getFieldUnit(field) && (
                              <Txt twcn="text-xl font-poppinsSemiBold text-light-grayText dark:text-dark-grayText ml-2">
                                {getFieldUnit(field)}
                              </Txt>
                            )}
                          </View>
                        </View>

                        <View
                          style={tw`flex-1 bg-light-grayBackground dark:bg-dark-grayPrimary rounded-xl p-4 border border-light-grayBorder dark:border-dark-grayBorder`}
                        >
                          <Txt twcn="text-xs font-poppinsMedium text-light-grayText dark:text-dark-grayText mb-2">
                            {getFieldLabel(nextField)}
                          </Txt>
                          <View
                            style={tw`flex-row items-center gap-2 pt-2 h-16`}
                          >
                            <View style={tw`flex-1`}>
                              <Input
                                value={formData[nextField.name] || ''}
                                onChangeText={(text) =>
                                  handleInputChange(nextField.name, text)
                                }
                                keyboardType="numeric"
                                caretHidden={false}
                                style={tw`text-light-text dark:text-dark-text text-3xl font-poppinsSemiBold leading-[0]`}
                                placeholder="-"
                              />
                            </View>
                            {getFieldUnit(nextField) && (
                              <Txt twcn="text-xl font-poppinsSemiBold text-light-grayText dark:text-dark-grayText ml-2">
                                {getFieldUnit(nextField)}
                              </Txt>
                            )}
                          </View>
                        </View>
                      </View>
                    )
                  }

                  if (!isOdd && !nextField) return null

                  if (isOdd && !nextField) {
                    return (
                      <View
                        key={field.name}
                        style={tw`bg-light-grayBackground dark:bg-dark-grayPrimary rounded-xl p-4 border border-light-grayBorder dark:border-dark-grayBorder`}
                      >
                        <Txt twcn="text-xs font-poppinsMedium text-light-grayText dark:text-dark-grayText mb-2">
                          {getFieldLabel(field)}
                        </Txt>
                        <View style={tw`flex-row items-center gap-2`}>
                          <View style={tw`flex-1`}>
                            <Input
                              value={formData[field.name] || ''}
                              onChangeText={(text) =>
                                handleInputChange(field.name, text)
                              }
                              keyboardType="numeric"
                              caretHidden={false}
                              twcnInput="text-light-text dark:text-dark-text text-4xl font-poppinsSemiBold"
                              placeholder="0"
                            />
                          </View>
                          {getFieldUnit(field) && (
                            <Txt twcn="text-xl font-poppinsSemiBold text-light-grayText dark:text-dark-grayText ml-2">
                              {getFieldUnit(field)}
                            </Txt>
                          )}
                        </View>
                      </View>
                    )
                  }

                  return null
                })}
            </View>
          </View>
        </Animated.View>
      )}
    </SafeView>
  )
}

export default CardioForm
