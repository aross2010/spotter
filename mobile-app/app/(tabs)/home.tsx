import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import useTheme from '../hooks/theme'
import { useUserStore } from '../../stores/user-store'
import tw from '../../tw'
import { formattedDate } from '../../functions/formatted-date'
import { formatNumber } from '../../functions/format-number'
import { Alert, View, Pressable } from 'react-native'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import { HomeData } from '../../utils/types'
import ActivityCalendar from '../../components/activity-calendar'
import {
  Calendar,
  ChevronRight,
  CurlyBraces,
  Dumbbell,
  Repeat,
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import WorkoutView from '../../components/workout'
import { WorkoutMinimal } from '../../context/workout-context'
import Button from '../../components/button'
import { Link, router, SplashScreen } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import ActivityMap from '../../components/activity-map'

SplashScreen.preventAutoHideAsync()

function getGreeting(d: Date = new Date()) {
  const h = d.getHours()
  if (h >= 5 && h < 12) return 'Good Morning'
  if (h >= 12 && h < 17) return 'Good Afternoon'
  if (h >= 17 && h < 22) return 'Good Evening'
  // late night / very early
  return 'Good Evening'
}

const Home = () => {
  const { user } = useUserStore()
  const { theme } = useTheme()
  const { fetchWithAuth } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)

  const featuredWorkoutStatus = data?.featuredWorkout?.status

  useEffect(() => {
    if (data) SplashScreen.hide()
  }, [data])

  const getHomeData = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/home/${user?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      setData(data)
    } catch (error: any) {
      Alert.alert('Error', error.message)
      console.error('Error fetching home data:', error.message)
    }
  }

  const stats = data && [
    {
      label: 'Workouts',
      value: data.totalWorkouts,
      icon: Calendar,
    },
    {
      label: 'Exercises',
      value: data.totalExercises,
      icon: Dumbbell,
    },
    {
      label: 'Sets',
      value: data.totalSets,
      icon: CurlyBraces,
    },
    {
      label: 'Reps',
      value: data.totalReps,
      icon: Repeat,
    },
  ]

  useEffect(() => {
    getHomeData()
  }, [])

  const renderedStats = (
    <View style={tw`flex-row flex-wrap gap-2`}>
      {stats &&
        stats.map((stat) => {
          const Icon = stat.icon
          return (
            <View
              key={stat.label}
              style={tw`flex-1 bg-white dark:bg-dark-grayPrimary rounded-xl p-3 min-w-[48%]`}
            >
              <View>
                <View style={tw`flex-row items-center justify-between`}>
                  <Txt twcn="text-light-grayText text-xs dark:text-dark-grayText">
                    {stat.label}
                  </Txt>
                  <Icon
                    size={22}
                    strokeWidth={2}
                    color={Colors.primary}
                  />
                </View>

                <Txt twcn="text-xl font-poppinsSemiBold">
                  {formatNumber(stat.value)}
                </Txt>
              </View>
            </View>
          )
        })}
    </View>
  )

  const activityMap = data && (
    <View>
      <Txt twcn="mb-4 text-base font-poppinsSemiBold">Activity</Txt>
      <ActivityMap data={data?.activityCalendar} />
    </View>
  )

  const featuredWorkout = data?.featuredWorkout && (
    <View>
      <Txt twcn="mb-4 text-base font-poppinsSemiBold">
        {featuredWorkoutStatus === 'current'
          ? 'Current Workout'
          : featuredWorkoutStatus === 'upcoming'
            ? 'Upcoming Workout'
            : 'Latest Workout'}
      </Txt>
      <WorkoutView
        workout={data.featuredWorkout.workout as WorkoutMinimal}
        roundBottom
        roundTop
      />
    </View>
  )

  const workoutPrompt = data?.totalWorkouts === 0 && (
    <Button onPress={() => router.push('/workout-form')}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-3 rounded-2xl -mb-4`}
      >
        <View style={tw`flex-row items-center gap-4`}>
          <View
            style={tw.style(
              'bg-white/20  items-center justify-between rounded-full p-2'
            )}
          >
            <Txt twcn="text-3xl">🎯</Txt>
          </View>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Txt twcn="text-lg font-poppinsSemiBold text-white mb-1">
                Ready to Start?
              </Txt>
              <ChevronRight
                size={22}
                strokeWidth={2}
                color={'#FFFFFF'}
              />
            </View>
            <Txt twcn="text-sm mb-3 text-light-grayPrimary">
              Log your first workout and let the progress begin!
            </Txt>
          </View>
        </View>
      </LinearGradient>
    </Button>
  )

  const userPage = (
    <View style={tw`mt-4 gap-8`}>
      {workoutPrompt}
      {renderedStats}
      {activityMap}
      {featuredWorkout}
    </View>
  )

  const greeting = getGreeting()

  return (
    <SafeView
      hasTabBar
      hasHeader
    >
      <Txt twcn="text-xs uppercase tracking-wide text-light-grayText dark:text-dark-grayText font-poppinsMedium">
        {formattedDate}
      </Txt>
      <Txt
        numberOfLines={1}
        twcn="text-xl font-poppinsSemiBold"
      >
        {greeting}, {user?.firstName} 👋
      </Txt>
      {userPage}
    </SafeView>
  )
}
export default Home
