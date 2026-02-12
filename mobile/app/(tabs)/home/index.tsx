import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useUserStore } from '../../../stores/user-store'
import tw from '../../../tw'
import { formattedDate } from '../../../functions/formatted-date'
import { formatNumber } from '../../../functions/format-number'
import { Alert, Appearance, Linking, View } from 'react-native'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import { BodyWeightData, HomeData, WorkoutMinimal } from '../../../utils/types'
import WorkoutView from '../../../components/workout'
import Button from '../../../components/button'
import {
  router,
  SplashScreen,
  useFocusEffect,
  useNavigation,
} from 'expo-router'
import ActivityMap from '../../../components/activity-map'
import { useCallback } from 'react'
import { useHomeDataStore } from '../../../stores/workout-store'
import Spinner from '../../../components/activity-indicator'
import Colors from '../../../constants/colors'
import { Link } from 'expo-router'
import { GlassView } from 'expo-glass-effect'
import useTheme from '../../hooks/theme'
import WeightEntryForm from '../../../components/weight-entry-form'
import { Button as SwiftButton, ContextMenu, Host } from '@expo/ui/swift-ui'
import SFIcon from '../../../components/sf-icon'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'
import MyBottomSheet from '../../../components/bottom-sheet'
import { SFSymbol } from 'expo-symbols'
import BodyWeight from '../../../components/body-weight'
import Constants from 'expo-constants'

function getGreeting(d: Date = new Date()) {
  const h = d.getHours()
  if (h >= 5 && h < 12) return 'Good Morning'
  if (h >= 12 && h < 17) return 'Good Afternoon'
  if (h >= 17 && h < 22) return 'Good Evening'
  // late night / very early
  return 'Good Evening'
}

export const updateRequired = async () => {
  const minVersion = await fetch(`${BASE_URL}/api/minVersion`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const { ios, android } = await minVersion.json()
  const current = Constants.expoConfig?.version ?? '0.0.0'
  const min = ios
  const toNums = (v: string) => v.split('.').map(Number)
  const [a, b, c] = toNums(current)
  const [x, y, z] = toNums(min)

  if (a !== x) return a < x
  if (b !== y) return b < y
  if (c !== z) return c < z

  return false
}

function getTimeSinceFirstWorkout(firstWorkoutDate: string) {
  const first = new Date(firstWorkoutDate)
  const now = new Date()

  const diffMs = Math.abs(now.getTime() - first.getTime())
  const diffDays = diffMs / (1000 * 60 * 60 * 24) + 1 // Add 1 so first day counts as day 1

  // Less than a month (30 days) - show days
  if (diffDays < 30) {
    const wholeDays = Math.floor(diffDays)
    return wholeDays === 1 ? '1 Day' : `${wholeDays} Days`
  }

  // Less than a year - show months (continuous, based on time)
  if (diffDays < 365) {
    const months = Math.floor((diffDays / 30) * 100) / 100
    return `${months.toFixed(2)} Months`
  }

  // A year or more - show years (continuous, based on time)
  const years = Math.floor((diffDays / 365) * 100) / 100
  return `${years.toFixed(2)} Years`
}

const Home = () => {
  const { user, preferences } = useUserStore()
  const { fetchWithAuth, isLoading, authUser } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const { shouldRefresh, clearRefresh } = useHomeDataStore()
  const { theme, colorScheme } = useTheme()
  const navigation = useNavigation()
  const ref = useRef<BottomSheetModal>(null)
  const weightUnit = preferences?.weightMetric ?? 'lbs' // 'lbs' or 'kgs'
  useEffect(() => {
    Appearance.setColorScheme(colorScheme === 'dark' ? 'dark' : 'light')
  }, [colorScheme])

  const featuredWorkoutStatus = data?.featuredWorkout?.status

  const getHomeData = async () => {
    if (!authUser?.id) return
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/home/${authUser.id}?unit=${weightUnit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
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
    }, [shouldRefresh]),
  )

  useEffect(() => {
    if (!authUser?.id) return
    SplashScreen.hideAsync()
    getHomeData()
  }, [authUser?.id])

  const checkForUpdate = async () => {
    const update = await updateRequired()
    if (!update) return
    Alert.alert(
      'Update Required',
      'Please update the app to use the latest features and improvements.',
      [
        {
          text: 'Update Now',
          onPress: () => {
            const url = 'itms-apps://apps.apple.com/app/id6754656428'
            Linking.openURL(url)
          },
        },
      ],
      { cancelable: false },
    )
  }

  useEffect(() => {
    checkForUpdate()
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={tw`flex-row items-center gap-6 px-2`}>
          <Button
            hitSlop={8}
            onPress={() => {
              router.push('/settings')
            }}
            accessibilityLabel="settings"
          >
            <SFIcon
              name="gear"
              color={Colors.primary}
              size={26}
            />
          </Button>
          <Host style={{ width: 26, height: 26 }}>
            <ContextMenu>
              <ContextMenu.Items>
                <SwiftButton
                  systemImage="figure.strengthtraining.traditional"
                  onPress={() => router.push('/workout-form')}
                >
                  Workout
                </SwiftButton>
                <SwiftButton
                  systemImage="book.pages.fill"
                  onPress={() => router.push('/notebook-entry-form')}
                >
                  Notebook Entry
                </SwiftButton>
                <SwiftButton
                  systemImage="scalemass.fill"
                  onPress={() => ref.current?.present()}
                >
                  Weight Entry
                </SwiftButton>
              </ContextMenu.Items>
              <ContextMenu.Trigger>
                <SFIcon
                  name="plus"
                  color={Colors.primary}
                  size={26}
                />
              </ContextMenu.Trigger>
            </ContextMenu>
          </Host>
        </View>
      ),
    })
  }, [])

  const stats = data && [
    {
      label: 'Workouts',
      value: data.totalWorkouts,
    },
    {
      label: 'Exercises',
      value: data.totalExercises,
    },
    {
      label: 'Sets',
      value: data.totalSets,
    },
    {
      label: 'Reps',
      value: data.totalReps,
    },
  ]

  const activityMap = (
    <View>
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <Txt twcn="text-lg font-semibold">Workout Activity</Txt>
      </View>

      <View style={tw`p-4 rounded-2xl bg-white dark:bg-dark-grayPrimary`}>
        <ActivityMap data={data?.activityCalendar || {}} />
      </View>
    </View>
  )

  const featuredWorkout = data?.featuredWorkout.status != 'none' && (
    <View>
      <Txt twcn="mb-2 text-lg font-semibold">
        {featuredWorkoutStatus === 'current'
          ? '💪 Current Workout'
          : featuredWorkoutStatus === 'upcoming'
            ? '⏰ Upcoming Workout'
            : 'Last Workout'}
      </Txt>
      {data?.featuredWorkout?.workout && (
        <WorkoutView
          workout={data.featuredWorkout.workout as WorkoutMinimal}
          roundBottom
          roundTop
          isHome
        />
      )}
    </View>
  )

  const features = [
    {
      iconName: 'figure.strengthtraining.traditional',
      title: 'Track Workouts',
      href: '/workouts',
      description:
        'Log training sessions with ease. Plan workouts, track sets, reps, weights, and monitor progress over time.',
    },
    {
      iconName: 'dumbbell.fill',
      title: 'Exercise Library',
      href: '/exercises',
      description:
        'Build your personal exercise database organized by muscle group. Track individual exercise performance and progress.',
    },
    {
      iconName: 'book.pages.fill',
      title: 'Training Notebook',
      href: '/notebook',
      description:
        'Document your fitness journey. Use enchanced markup note taking to track your thoughts, goals, warmups, stretches, injuries, and more.',
    },
    {
      iconName: 'scalemass.fill',
      title: 'Body Weight Tracking',
      onPress: () => ref.current?.present(),
      description:
        'Monitor your body weight over time. Track progress and analyze trends to optimize your fitness journey.',
    },
    {
      iconName: 'chart.bar.fill',
      title: 'Training Insights',
      href: '/insights',
      description:
        'Gain valuable insights into your training progress. Analyze trends, muscle group usage, training habits, and more to optimize your workouts.',
    },
    {
      iconName: 'sharedwithyou',
      title: 'Share Everything',
      href: null,
      description:
        'One-click sharing of workouts and notebook entries to friends. Collaborate and stay motivated together.',
    },
  ]

  const appFeatures = data?.totalWorkouts == 0 && (
    <View style={tw`mt-4`}>
      <Txt twcn="text-xl font-semibold mb-2">Explore Spotter</Txt>
      <View style={tw`gap-3`}>
        {features.map((feature) => {
          const hasLink = Boolean(feature.href)
          const hasButton = Boolean(feature.onPress)

          const content = (
            <View
              key={feature.title}
              style={tw`rounded-xl p-4 bg-white dark:bg-dark-grayPrimary`}
            >
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View style={tw`flex-row items-center gap-3`}>
                  <View
                    style={tw`rounded-full bg-primary/10 p-2 items-center justify-center`}
                  >
                    <SFIcon
                      name={feature.iconName as SFSymbol}
                      size={24}
                      color={Colors.primary}
                    />
                  </View>
                  <Txt twcn="text-base font-semibold">{feature.title}</Txt>
                </View>
                <SFIcon
                  name="arrow.right"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                {feature.description}
              </Txt>
            </View>
          )

          if (hasLink)
            return (
              <Link
                key={feature.title}
                href={feature.href!}
              >
                {content}
              </Link>
            )

          if (hasButton)
            return (
              <Button
                key={feature.title}
                onPress={feature.onPress!}
              >
                {content}
              </Button>
            )

          return content
        })}
      </View>
    </View>
  )

  const firstWorkoutDate =
    data?.activityCalendar && Object.keys(data.activityCalendar).sort()[0]
  const timeSinceFirst = firstWorkoutDate
    ? getTimeSinceFirstWorkout(firstWorkoutDate)
    : null

  const statsTogether = (
    <GlassView
      style={tw`rounded-2xl bg-primary p-3 relative overflow-hidden bg-white dark:bg-dark-grayPrimary`}
    >
      <View style={tw`items-center flex-row gap-4`}>
        <View
          style={tw`rounded-full bg-primary/75 h-10 w-10 items-center justify-center`}
        >
          <Txt twcn="text-2xl">🚀</Txt>
        </View>
        <Txt twcn="text-lg font-semibold">
          {timeSinceFirst
            ? `${timeSinceFirst} on Spotter`
            : '1st Day on Spotter!'}
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
                <Txt twcn="text-sm font-light">{stat.label}</Txt>
                <Txt twcn="text-xl font-semibold">
                  {formatNumber(stat.value)}
                </Txt>
              </View>
            )
          })}
      </View>
      <View
        style={tw`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-primary/75`}
      />
      <View
        style={tw`absolute -bottom-10 -left-8 w-16 h-16 rounded-full bg-primary/75`}
      />
    </GlassView>
  )

  const handleChangeBodyWeightData = (data: BodyWeightData) => {
    setData((prevData) => ({
      ...prevData!,
      bodyWeightData: data,
    }))
  }

  const weight = data && data.bodyWeightData && (
    <View>
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <Txt twcn="text-lg font-semibold">Body Weight</Txt>
        <Button
          twcn="flex-row items-center gap-1"
          onPress={() => {
            router.push({
              pathname: '/bodyweight-overview',
              params: {
                bodyWeightData: JSON.stringify(data?.bodyWeightData),
              },
            })
          }}
        >
          <Txt twcn="text-primary dark:text-primary font-semibold">
            View Details
          </Txt>
          <SFIcon
            name="chevron.right"
            size={12}
            color={Colors.primary}
          />
        </Button>
      </View>
      <View
        style={tw`p-4 bg-white dark:bg-dark-grayPrimary rounded-2xl min-h-32`}
      >
        <BodyWeight
          data={data?.bodyWeightData || null}
          setData={handleChangeBodyWeightData}
          openForm={() => ref.current?.present()}
        />
      </View>
    </View>
  )

  const userPage = (
    <View style={tw`mt-2 gap-6`}>
      {statsTogether}
      {activityMap}
      {appFeatures}
      {weight}
      {featuredWorkout}
    </View>
  )

  const greeting = getGreeting()

  if (loading) return <Spinner />

  return (
    <>
      <SafeView
        hasTabBar
        hasHeader
      >
        <Txt twcn="text-xs uppercase text-light-grayText dark:text-dark-grayText font-medium">
          {formattedDate}
        </Txt>
        <Txt
          numberOfLines={1}
          twcn="text-lg font-semibold"
        >
          {greeting}, {user?.firstName} 👋
        </Txt>
        {userPage}
      </SafeView>
      <MyBottomSheet
        ref={ref}
        usesKeyboard
      >
        <WeightEntryForm closeModal={() => ref.current?.dismiss()} />
      </MyBottomSheet>
    </>
  )
}
export default Home
