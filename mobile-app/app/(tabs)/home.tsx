import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import useTheme from '../hooks/theme'
import { useUserStore } from '../../stores/user-store'
import tw from '../../tw'
import { formattedDate } from '../../functions/formatted-date'
import { Pressable } from 'react-native'

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

  console.log(user)

  const greeting = getGreeting()
  return (
    <SafeView>
      <Txt twcn="text-xs uppercase tracking-wide text-light-grayText dark:text-dark-grayText font-poppinsMedium">
        {formattedDate}
      </Txt>
      <Txt twcn="text-xl font-poppinsMedium">
        {greeting}, {user?.firstName} 👋
      </Txt>
    </SafeView>
  )
}
export default Home
