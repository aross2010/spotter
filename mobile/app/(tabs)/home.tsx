import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { useUserStore } from '../../stores/user-store'
import tw from '../../tw'
import { formattedDate } from '../../functions/formatted-date'
import { formatNumber } from '../../functions/format-number'
import { Alert, View } from 'react-native'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import { HomeData, WorkoutMinimal } from '../../utils/types'
import {
  Book,
  Calendar,
  ChevronRight,
  CurlyBraces,
  Dumbbell,
  Repeat,
} from 'lucide-react-native'
import WorkoutView from '../../components/workout'
import Button from '../../components/button'
import { router, SplashScreen, useFocusEffect } from 'expo-router'
import ActivityMap from '../../components/activity-map'
import { useCallback } from 'react'
import { useHomeDataStore } from '../../stores/workout-store'
import Spinner from '../../components/activity-indicator'
import Colors from '../../constants/colors'
import { Link } from 'expo-router'

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
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 // Add 1 so first day counts as day 1

  // Less than a month (30 days) - show days
  if (diffDays < 30) {
    return diffDays === 1 ? '1 Day' : `${diffDays} Days`
  }

  // Less than a year - show months with decimal
  if (diffDays < 365) {
    const months = parseFloat((diffDays / 30).toFixed(2))
    return `${months} Months`
  }

  // A year or more - show years with decimal
  const years = parseFloat((diffDays / 365).toFixed(2))
  return `${years} Years`
}

const Home = () => {
  const { user } = useUserStore()
  const { fetchWithAuth, isLoading } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const { shouldRefresh, clearRefresh } = useHomeDataStore()

  const featuredWorkoutStatus = data?.featuredWorkout?.status

  // useEffect(() => {
  //   if (data && !loading) {
  //     SplashScreen.hideAsync()
  //   }
  // }, [data, isLoading])

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
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (shouldRefresh) {
        getHomeData()
        clearRefresh()
      }
      return () => {}
    }, [shouldRefresh])
  )

  useEffect(() => {
    SplashScreen.hideAsync()
    getHomeData()
  }, [])

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

  const activityMap = Object.keys(data?.activityCalendar || {}).length > 0 && (
    <View>
      <Txt twcn="mb-4 text-base font-poppinsSemiBold">Activity</Txt>
      <View style={tw`p-4 rounded-xl bg-white dark:bg-dark-grayPrimary`}>
        <ActivityMap data={data?.activityCalendar || {}} />
      </View>
    </View>
  )

  const featuredWorkout = data?.featuredWorkout.status != 'none' && (
    <View>
      <Txt twcn="mb-4 text-base font-poppinsSemiBold">
        {featuredWorkoutStatus === 'current'
          ? '💪 Current Workout'
          : featuredWorkoutStatus === 'upcoming'
            ? '⏰ Upcoming Workout'
            : 'Last Workout'}
      </Txt>
      <WorkoutView
        workout={data?.featuredWorkout.workout as WorkoutMinimal}
        roundBottom
        roundTop
        isHome
      />
    </View>
  )

  const workoutPrompt = data?.totalWorkouts == 0 && (
    <Button
      onPress={() => router.push('/workout-form?from=home')}
      twcn="p-3 rounded-2xl -mb-4 bg-primary relative overflow-hidden"
    >
      <View style={tw`flex-row items-center gap-4`}>
        <View style={tw`rounded-full bg-white/25 p-2 h-12 w-12 items-center`}>
          <Txt twcn="text-2xl">🎯</Txt>
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
          <Txt twcn="text-sm mb-3 text-dark-text">
            Log your first workout and let the progress begin!
          </Txt>
        </View>
      </View>
      <View
        style={tw`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-white/10`}
      />
      <View
        style={tw`absolute -bottom-10 -left-8 w-16 h-16 rounded-full bg-white/10`}
      />
    </Button>
  )

  const features = [
    {
      icon: Calendar,
      title: 'Track Workouts',
      href: '/workouts',
      description:
        'Log your training sessions with ease. Add exercises, sets, reps, and weight. Schedule future workouts and track your consistency over time.',
    },
    {
      icon: Dumbbell,
      title: 'Exercise Library',
      href: '/exercises',
      description:
        'Build your personal exercise database. View detailed progression charts, track personal records, and analyze performance trends.',
    },
    {
      icon: Book,
      title: 'Training Notebook',
      href: '/notebook',
      description:
        'Document your fitness journey. Use it to track injuries, progress, warm-up routines, stretching, diet notes, weight, and anything else.',
    },
  ]

  const appFeatures = data?.totalWorkouts == 0 && (
    <View>
      <Txt twcn="text-base font-poppinsSemiBold mb-4">
        ✨ Featured in Spotter
      </Txt>
      <View style={tw`gap-3`}>
        {features.map((feature) => (
          <Link
            href={feature.href}
            key={feature.title}
          >
            <View
              key={feature.title}
              style={tw`rounded-xl p-4 bg-white dark:bg-dark-grayPrimary`}
            >
              <View style={tw`flex-row items-center gap-3 mb-4`}>
                <View
                  style={tw`rounded-full bg-primary/10 p-2 items-center justify-center`}
                >
                  <feature.icon
                    size={20}
                    color={Colors.primary}
                    strokeWidth={1.5}
                  />
                </View>
                <Txt twcn="text-base font-poppinsMedium">{feature.title}</Txt>
              </View>
              <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                {feature.description}
              </Txt>
            </View>
          </Link>
        ))}
      </View>
    </View>
  )

  const firstWorkoutDate =
    data?.activityCalendar && Object.keys(data.activityCalendar).sort()[0]
  const timeSinceFirst = firstWorkoutDate
    ? getTimeSinceFirstWorkout(firstWorkoutDate)
    : ''

  const statsTogether = data && data.totalWorkouts > 0 && (
    <View style={tw`rounded-2xl p-3 bg-primary relative overflow-hidden`}>
      <View style={tw`items-center flex-row gap-4`}>
        <View
          style={tw`rounded-full bg-white/25 h-10 w-10 items-center justify-center`}
        >
          <Txt twcn="text-2xl">🚀</Txt>
        </View>
        <Txt twcn="text-white text-lg font-poppinsSemiBold">
          {timeSinceFirst} on Spotter
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
      <View
        style={tw`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-white/10`}
      />
      <View
        style={tw`absolute -bottom-10 -left-8 w-16 h-16 rounded-full bg-white/10`}
      />
    </View>
  )

  const userPage = (
    <View style={tw`mt-4 gap-8`}>
      {workoutPrompt}
      {appFeatures}
      {statsTogether}
      {activityMap}
      {featuredWorkout}
    </View>
  )

  const greeting = getGreeting()

  return loading ? (
    <Spinner />
  ) : (
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
