import SafeView from '../../components/safe-view'
import { useAuth } from '../../context/auth-context'
import Txt from '../../components/text'
import { useUserStore } from '../../stores/user-store'

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
      <Txt className="uppercase text-light-grayText text-sm">
        {formattedDate}
      </Txt>
      <Txt className="text-2xl mb-4 font-poppinsMedium">
        {greeting}, {user?.firstName} 👋
      </Txt>
    </SafeView>
  )
}
export default Home
