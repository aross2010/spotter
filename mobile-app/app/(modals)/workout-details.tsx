import { Alert, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import { WorkoutDetails as WorkoutDetailsType } from '../../context/workout-context'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import tw from '../../tw'
import useTheme from '../hooks/theme'
import { Calendar, MapPin } from 'lucide-react-native'
import { formatDate } from '../../functions/formatted-date'
import Spinner from '../../components/activity-indicator'

// display at the header level: location, date, sets
// then notes
// muscle group analysis (button to toggle)
// exercises in the timeline form like the workout form (same exact layout)
// tags at the bottom
// add share and edit buttons at the top right

const WorkoutDetails = () => {
  const [workout, setWorkout] = useState<WorkoutDetailsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigation = useNavigation()
  const { id } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
    const getWorkoutDetails = async () => {
      setIsLoading(true)
      try {
        const response = await fetchWithAuth(
          `${BASE_URL}/api/workouts/info/${id}`,
          {
            method: 'GET',
          }
        )
        const workoutDetails = (await response.json()) as WorkoutDetailsType
        setWorkout(workoutDetails)
      } catch (error: any) {
        Alert.alert('Error', error.message)
      } finally {
        setIsLoading(false)
      }
    }
    getWorkoutDetails()
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: workout?.name || 'Workout Details',
      headerShown: true,
    })
  }, [navigation, workout?.name])

  return !workout ? (
    <Spinner />
  ) : (
    <SafeView>
      <View style={tw`flex-row gap-2 items-center`}>
        <Calendar
          size={16}
          color={theme.text}
        />
        <Txt>{formatDate(workout.date)}</Txt>
      </View>
      <View style={tw`flex-row gap-2 items-center`}>
        <MapPin
          size={16}
          color={theme.text}
        />
        <Txt>{workout.location}</Txt>
      </View>
    </SafeView>
  )
}

export default WorkoutDetails

const styles = StyleSheet.create({})
