import SafeView from '../../components/safe-view'
import { useAuth } from '../../context/auth-context'
import Button from '../../components/button'
import Txt from '../../components/text'
import { Link } from 'expo-router'

const Home = () => {
  const { fetchWithAuth, user, signOut } = useAuth()

  return (
    <SafeView>
      <Txt>Home</Txt>
      <Button
        onPress={async () => {
          const response = await fetchWithAuth(
            `http://localhost:3000/api/users/${user?.id}`,
            {
              method: 'GET',
            }
          )
          const data = await response.json()
          console.log('User data:', data)
        }}
      >
        Fetch User Data
      </Button>
      <Button
        onPress={() => {
          console.log('Signing out...')
          signOut()
        }}
      >
        Sign Out
      </Button>
      <Link
        href="/weight-form"
        asChild
      >
        <Button>Open Settings</Button>
      </Link>
    </SafeView>
  )
}

export default Home
