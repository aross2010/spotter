import SafeView from '../../components/safe-view'
import { useAuth } from '../../context/auth-context'
import Button from '../../components/button'
import Txt from '../../components/text'
import { Link } from 'expo-router'

function getGreeting(d: Date = new Date()) {
  const h = d.getHours()
  if (h >= 5 && h < 12) return 'Good Morning'
  if (h >= 12 && h < 17) return 'Good Afternoon'
  if (h >= 17 && h < 22) return 'Good Evening'
  // late night / very early
  return 'Good Evening'
}

const Home = () => {
  const { fetchWithAuth, user } = useAuth()

  // day (abbreviated). month, day, year
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const greeting = getGreeting()

  return (
    <SafeView>
      <Txt className="uppercase text-light-grayText font-geologicaSemiBold text-sm">
        {formattedDate}
      </Txt>
      <Txt className="text-2xl font-geologicaSemiBold mb-4">
        {greeting}, {user?.firstName} 👋
      </Txt>
    </SafeView>
  )
}

export default Home
