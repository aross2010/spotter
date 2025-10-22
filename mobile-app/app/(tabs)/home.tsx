import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import useTheme from '../hooks/theme'
import { useUserStore } from '../../stores/user-store'
import tw from '../../tw'
import { formattedDate } from '../../functions/formatted-date'
import { Alert, Pressable, View } from 'react-native'
import { Link } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import { HomeData } from '../../utils/types'
import ActivityCalendar from '../../components/activity-calendar'

// structure:
// main stats at top (# workouts, sets, reps, and total weight lifted)
// calendar/grid heat map view by month
// todays workout (if any)
// INSIGHTS Section: one graph (activity over time), link in header to view more insights

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

  useEffect(() => {
    getHomeData()
  }, [])

  const stats = data && <View></View>

  const greeting = getGreeting()
  return (
    <SafeView
      hasTabBar
      hasHeader
    >
      <Txt twcn="text-xs uppercase tracking-wide text-light-grayText dark:text-dark-grayText font-poppinsMedium">
        {formattedDate}
      </Txt>
      <Txt twcn="text-xl font-poppinsMedium">
        {greeting}, {user?.firstName} 👋
      </Txt>
      <View style={tw`mt-4`}>
        {stats}
        {data && (
          <>
            <Txt twcn="my-4 text-base font-poppinsSemiBold">Activity</Txt>
            <ActivityCalendar data={data?.activityCalendar} />
          </>
        )}
      </View>
    </SafeView>
  )
}
export default Home
