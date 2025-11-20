import { Alert, View } from 'react-native'
import React from 'react'
import Button from './button'
import { SymbolView } from 'expo-symbols'
import Colors from '../constants/colors'
import { router } from 'expo-router'
import { useWorkoutForm } from '../context/workout-form-context'
import Txt from './text'
import tw from '../tw'
import { Trash2 } from 'lucide-react-native'
import { cardioMachines } from '../constants/data'
import useTheme from '../app/hooks/theme'

const WorkoutCardio = () => {
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { theme } = useTheme()

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    const parts: string[] = []

    if (h > 0) {
      parts.push(`${h} hr${h !== 1 ? 's' : ''}`)
    }
    if (m > 0) {
      parts.push(`${m} min${m !== 1 ? 's' : ''}`)
    }
    if (s > 0) {
      parts.push(`${s} sec${s !== 1 ? 's' : ''}`)
    }

    return parts.join(' ') || '0 secs'
  }

  const getMachineIcon = (machineId: string) => {
    const machine = cardioMachines.find((m) => m.name === machineId)
    return machine?.iconName || 'figure.run.treadmill'
  }

  const handleDelete = (index: number) => {
    Alert.alert(
      'Delete Cardio Entry',
      'Are you sure you want to delete this cardio entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedEntries = workoutData.cardioEntries?.filter(
              (_, i) => i !== index
            )
            setWorkoutData({
              ...workoutData,
              cardioEntries: updatedEntries,
            })
          },
        },
      ]
    )
  }

  // If there are cardio entries, display them
  if (workoutData.cardioEntries && workoutData.cardioEntries.length > 0) {
    return (
      <View style={tw`w-full gap-3 mb-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Txt twcn=" font-poppinsSemiBold ">Cardio</Txt>
          <Button
            onPress={() => {
              router.push('/cardio-form')
            }}
            twcnText="font-poppinsSemiBold text-primary dark:text-primary text-sm"
            text="Add More"
          />
        </View>
        {workoutData.cardioEntries.map((entry, index) => {
          const duration = formatDuration(entry.entryData.duration)
          return (
            <Button
              key={index}
              onPress={() => router.push(`/cardio-form?editIndex=${index}`)}
              twcn="bg-light-grayBackground dark:bg-dark-grayPrimary rounded-xl p-3 border border-light-grayBorder dark:border-dark-grayBorder"
            >
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-3 flex-1`}>
                  <SymbolView
                    name={getMachineIcon(entry.machineId) as any}
                    tintColor={Colors.primary}
                    style={{ width: 28, height: 28 }}
                  />
                  <View style={tw`flex-1`}>
                    <Txt twcn="text-base font-poppinsSemiBold">
                      {entry.machineId}
                    </Txt>
                    <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                      {duration}
                      {entry.startOfWorkout && ' • Start of Workout '}
                      {entry.endOfWorkout && ' • End of Workout '}
                    </Txt>
                  </View>
                </View>

                <Button
                  onPress={(e) => {
                    e?.stopPropagation?.()
                    handleDelete(index)
                  }}
                  twcn="p-2"
                  hitSlop={8}
                >
                  <Trash2
                    size={20}
                    color={theme.grayText}
                  />
                </Button>
              </View>
            </Button>
          )
        })}
      </View>
    )
  }

  // Default button to add cardio
  return (
    <Button
      onPress={() => {
        router.push('/cardio-form')
      }}
      twcnText="font-poppinsSemiBold text-primary dark:text-primary"
      twcn="flex-row-reverse items-center gap-1"
      text="Add Cardio"
    >
      <SymbolView
        name="figure.run.treadmill"
        tintColor={Colors.primary}
        style={{
          width: 24,
          height: 24,
        }}
      />
    </Button>
  )
}

export default WorkoutCardio
