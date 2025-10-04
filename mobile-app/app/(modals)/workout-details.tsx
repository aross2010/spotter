import { Alert, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import { WorkoutDetails as WorkoutDetailsType } from '../../context/workout-context'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import tw from '../../tw'
import useTheme from '../hooks/theme'
import { Calendar, MapPin, Pencil, Share } from 'lucide-react-native'
import { formatDate } from '../../functions/formatted-date'
import Spinner from '../../components/activity-indicator'
import Button from '../../components/button'
import Colors from '../../constants/colors'
import { capString } from '../../functions/cap-string'
import BarGraph from '../../components/bar-graph'

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

  const handleShareWorkout = async () => {}

  useEffect(() => {
    navigation.setOptions({
      headerTitle: workout?.name || 'Workout Details',
      headerShown: true,
      headerRight: () => (
        <View style={tw`flex-row items-center gap-2`}>
          <Button
            onPress={() =>
              router.push({
                pathname: '/workout-form',
                params: {
                  id: workout?.id,
                },
              })
            }
            twcn="bg-primary/10 rounded-2xl p-2"
          >
            <Pencil
              size={20}
              color={Colors.primary}
            />
          </Button>
          <Button
            onPress={handleShareWorkout}
            twcn="bg-primary/10 rounded-2xl p-2"
          >
            <Share
              size={20}
              color={Colors.primary}
            />
          </Button>
        </View>
      ),
    })
  }, [navigation, workout?.name])

  return !workout ? (
    <Spinner />
  ) : (
    <SafeView>
      <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium tracking-wide">
        {capString(
          `${formatDate(workout.date)}${workout.location ? ` @ ${workout.location}` : ''}`,
          40
        )}
      </Txt>
      {workout.notes && (
        <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText mt-4">
          {workout.notes}
        </Txt>
      )}
      {workout.muscleGroupAnalysis.length > 0 && (
        <BarGraph
          data={workout.muscleGroupAnalysis.map((item) => ({
            label: item.muscleGroup,
            value: item.percentage,
          }))}
        />
      )}
    </SafeView>
  )
}

export default WorkoutDetails

const styles = StyleSheet.create({})
