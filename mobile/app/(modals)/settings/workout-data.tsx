import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { CustomData } from '../../../utils/types'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import Spinner from '../../../components/activity-indicator'
import Txt from '../../../components/text'
import tw from '../../../tw'
import { GlassView } from 'expo-glass-effect'
import Button from '../../../components/button'
import SFIcon from '../../../components/sf-icon'
import Colors from '../../../constants/colors'
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { toTitleCase } from '../../../functions/utils'
import SafeView from '../../../components/safe-view'
import Input from '../../../components/input'
import { router, useNavigation } from 'expo-router'
import useTheme from '../../hooks/theme'

type WorkoutDataToSend = {
  names?: {
    prevName: string
    newName: string
  }[]
  locations?: {
    prevName: string
    newName: string
  }[]
  tags?: {
    prevName: string
    newName?: string
    delete?: boolean
  }[]
}

type WorkoutData = CustomData['workouts']
const WorkoutData = () => {
  const [loading, setLoading] = useState(true)
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null)
  const [initialWorkoutData, setInitialWorkoutData] =
    useState<WorkoutData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { fetchWithAuth, authUser } = useAuth()
  const navigation = useNavigation()
  const { theme } = useTheme()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <View style={tw`flex-row items-center justify-center`}>
            {isSaving ? (
              <Spinner
                twcn="w-9"
                fullScreen={false}
              />
            ) : (
              <Button
                onPress={handleSubmitChange}
                hitSlop={12}
                accessibilityLabel="Save Workout"
                disabled={isSaving || !hasChanges}
                twcn="w-9 flex-row items-center justify-center h-full"
              >
                <SFIcon
                  name="checkmark"
                  size={26}
                  color={hasChanges ? Colors.primary : theme.grayText}
                />
              </Button>
            )}
          </View>
        )
      },
    })
  }, [hasChanges, isSaving])

  const getWorkoutData = async () => {
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/users/workoutData/${authUser?.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      const data = await res.json()
      setWorkoutData(data)
      setInitialWorkoutData(JSON.parse(JSON.stringify(data)))
    } catch (error: any) {
      console.error('Error fetching workout data:', error.message)
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getWorkoutData()
  }, [])

  useEffect(() => {
    // check if workoutData differs from initialWorkoutData
    const changesExist =
      JSON.stringify(workoutData) !== JSON.stringify(initialWorkoutData)
    setHasChanges(changesExist)
  }, [workoutData, initialWorkoutData])

  const getDataToSend = (): WorkoutDataToSend => {
    if (!workoutData || !initialWorkoutData) return {}

    const result: WorkoutDataToSend = {}

    // Check names for changes
    const changedNames = workoutData.names
      .map((item, index) => {
        const initial = initialWorkoutData.names[index]
        if (initial && item.name !== initial.name) {
          return { prevName: initial.name, newName: item.name }
        }
        return null
      })
      .filter(
        (item): item is { prevName: string; newName: string } => item !== null,
      )

    if (changedNames.length > 0) {
      result.names = changedNames
    }

    // Check locations for changes
    const changedLocations = workoutData.locations
      .map((item, index) => {
        const initial = initialWorkoutData.locations[index]
        if (initial && item.name !== initial.name) {
          return { prevName: initial.name, newName: item.name }
        }
        return null
      })
      .filter(
        (item): item is { prevName: string; newName: string } => item !== null,
      )

    if (changedLocations.length > 0) {
      result.locations = changedLocations
    }

    // Check tags for changes
    const changedTags = workoutData.tags
      .map((item, index) => {
        const initial = initialWorkoutData.tags[index]
        if (initial && item.name !== initial.name) {
          return { prevName: initial.name, newName: item.name }
        }
        return null
      })
      .filter(
        (item): item is { prevName: string; newName: string } => item !== null,
      )

    if (changedTags.length > 0) {
      result.tags = changedTags
    }

    return result
  }

  const handleSubmitChange = async () => {
    // determine what has changed and only send those changes
    try {
      setIsSaving(true)
      const data: WorkoutDataToSend = getDataToSend()
      const res = await fetchWithAuth(
        `${BASE_URL}/api/users/workoutData/${authUser?.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      )
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNameChange = (
    type: 'names' | 'locations' | 'tags',
    index: number,
    text: string,
  ) => {
    if (!workoutData) return

    setWorkoutData({
      ...workoutData,
      [type]: workoutData[type].map((item, i) =>
        i === index ? { ...item, name: text } : item,
      ),
    })
  }

  if (loading) return <Spinner />

  if (!workoutData) {
    return (
      <SafeView twcnContentView="items-center justify-center mt-12">
        <Txt twcn="text-center text-base text-light-grayText dark:text-dark-grayText">
          No workout data found. Create workouts to be able to modify their
          metadata here.
        </Txt>
      </SafeView>
    )
  }

  const workoutDataTypes = ['names', 'locations', 'tags'] as const

  const renderedWorkoutData = workoutDataTypes.map((type) => {
    const arr = workoutData[type]

    return (
      <View key={type}>
        <Txt twcn="font-semibold text-base mb-2">
          {toTitleCase(type)} ({arr.length})
        </Txt>
        <View style={tw`gap-3`}>
          {arr.map((item, index) => {
            const name = item.name
            return (
              <View
                key={`${type}-item-${index}`}
                style={tw`flex-row justify-between items-center gap-2`}
              >
                <Input
                  key={`${type}-item-${index}`}
                  value={name}
                  onChangeText={(text) => handleNameChange(type, index, text)}
                  maxLength={50}
                  fullBorder
                  twcnInput="flex-1"
                />
                <View style={tw`items-end w-6`}>
                  <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs">
                    {item.used}
                  </Txt>
                </View>
              </View>
            )
          })}
        </View>
      </View>
    )
  })

  return (
    <SafeView
      scroll
      style={tw`pb-8`}
      keyboardAvoiding
    >
      <Txt twcn="text-light-grayText dark:text-dark-grayText mb-6">
        Modify the values of your workout data across all workouts that use
        them.
      </Txt>
      <View style={tw`gap-6`}>{renderedWorkoutData}</View>
    </SafeView>
  )
}

export default WorkoutData

const styles = StyleSheet.create({})
