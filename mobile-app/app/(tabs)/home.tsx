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
  ChartColumnIncreasing,
  ChevronRight,
  CurlyBraces,
  Dumbbell,
  Repeat,
  Trophy,
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

function getTimeSinceFirstWorkout(firstWorkoutDate: string) {
  const first = new Date(firstWorkoutDate)
  const now = new Date()

  const diffTime = Math.abs(now.getTime() - first.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Less than a month (30 days) - show days
  if (diffDays < 30) {
    return diffDays === 1 ? 'Day' : `${diffDays} Days`
  }

  // Less than 2 months (60 days) - show weeks
  if (diffDays < 60) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? 'Week' : `${weeks} Weeks`
  }

  // Less than a year - show months
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? 'Month' : `${months} Months`
  }

  // A year or more - show years and months
  const years = Math.floor(diffDays / 365)
  const remainingDays = diffDays % 365
  const months = Math.floor(remainingDays / 30)

  if (months === 0) {
    return years === 1 ? 'Year' : `${years} Years`
  }

  const yearText = years === 1 ? 'Year' : `${years} Years`
  const monthText = months === 1 ? 'a Month' : `${months} Months`
  return `${yearText} and ${monthText}`
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
      console.log('Home data:', data)
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

  const firstWorkoutDate =
    data?.activityCalendar && Object.keys(data.activityCalendar).sort()[0]
  const timeSinceFirst = firstWorkoutDate
    ? getTimeSinceFirstWorkout(firstWorkoutDate)
    : ''

  const statsTogether = data && (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={tw`rounded-2xl -mb-4`}
    >
      <View style={tw`rounded-2xl p-3`}>
        <View style={tw`items-center flex-row gap-4`}>
          <View style={tw`rounded-full bg-white/25 p-2`}>
            <Trophy
              size={20}
              color={'#FFFFFF'}
            />
          </View>
          <Txt twcn="text-white text-base font-poppinsSemiBold">
            Your Last {timeSinceFirst}
          </Txt>
        </View>
        <View style={tw`mt-4 flex-row justify-between`}>
          {stats &&
            stats.map((stat) => {
              return (
                <View
                  key={stat.label}
                  style={tw`items-center flex-1`}
                >
                  <Txt twcn="text-white text-sm font-poppinsLight">
                    {stat.label}
                  </Txt>
                  <Txt twcn="text-white text-xl font-poppinsSemiBold">
                    {formatNumber(stat.value)}
                  </Txt>
                </View>
              )
            })}
        </View>
      </View>
    </LinearGradient>
  )

  const userPage = (
    <View style={tw`mt-4 gap-8`}>
      {workoutPrompt}
      {statsTogether}
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
