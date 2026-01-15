import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { Alert, Image, View } from 'react-native'
import { useUserStore } from '../../../stores/user-store'
import Button from '../../../components/button'
import Colors from '../../../constants/colors'
import { useAuth } from '../../../context/auth-context'
import { Provider, Providers } from '../../../utils/types'
import { useEffect, useState } from 'react'
import tw from '../../../tw'
import Spinner from '../../../components/activity-indicator'
import { BASE_URL } from '../../../constants/auth'
import SFIcon from '../../../components/sf-icon'
import useTheme from '../../hooks/theme'
import googleLogo from '../../../assets/google.png'
import appleLogo from '../../../assets/apple.png'

const providerOptions = [
  {
    title: 'Google',
    provider: 'google',
    color: '#FFFFFF',
    logo: googleLogo,
  },
  {
    title: 'Apple',
    provider: 'apple',
    color: '#000000',
    logo: appleLogo,
  },
] as const

const LinkedAccounts = () => {
  const { linkAppleAccount, linkGoogleAccount, fetchWithAuth, authUser } =
    useAuth()
  const [loading, setIsLoading] = useState(false)
  const [providersLinked, setProvidersLinked] = useState<Provider[]>([])
  const { theme, colorScheme } = useTheme()

  const getProvidersLinked = async () => {
    try {
      setIsLoading(true)
      const res = await fetchWithAuth(`${BASE_URL}/api/users/${authUser?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const { providers } = await res.json()
      setProvidersLinked(providers)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getProvidersLinked()
  }, [])

  const handleLinking = async (provider: Providers) => {
    try {
      if (provider === 'apple') await linkAppleAccount()
      else if (provider === 'google') await linkGoogleAccount()
      else return
    } catch (error) {
      console.error('Error linking account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderedProviders = providerOptions.map((option) => {
    const { title, provider, color, logo } = option
    const isLinked = providersLinked.some((p) => p.name === provider)
    const providerEmail = providersLinked.find(
      (p) => p.name === provider
    )?.email

    return (
      <View key={provider}>
        <Button
          onPress={() => !isLinked && handleLinking(provider)}
          style={[
            tw`h-14 rounded-full flex-row items-center justify-center gap-3`,
            { backgroundColor: color },
          ]}
          disabled={isLinked}
        >
          <Image
            source={logo}
            style={{
              width: 20,
              height: 20,
            }}
            resizeMode="contain"
          />
          <Txt
            twcn={`font-semibold text-sm ${provider === 'apple' ? 'text-white' : 'dark:text-light-text text-light-text'}`}
          >
            {isLinked ? `${title} Connected` : `Connect ${title}`}
          </Txt>
          <SFIcon
            name={isLinked ? 'checkmark.circle.fill' : 'plus.circle.fill'}
            size={20}
            color={provider === 'apple' ? '#FFFFFF' : '#000000'}
          />
        </Button>
        {isLinked && providerEmail && (
          <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs mt-1 text-center">
            {providerEmail}
          </Txt>
        )}
      </View>
    )
  })

  return loading ? (
    <Spinner />
  ) : (
    <SafeView scroll={false}>
      <Txt twcn="text-light-grayText dark:text-dark-grayText mb-6">
        Securely link multiple sign-in providers (e.g., Apple and Google) to a
        single account, so you can log in with any of them across devices.
      </Txt>
      <View style={tw`gap-4`}>{renderedProviders}</View>
    </SafeView>
  )
}

export default LinkedAccounts
