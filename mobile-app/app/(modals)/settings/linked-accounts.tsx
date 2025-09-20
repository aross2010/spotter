import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { View } from 'react-native'
import { useUserStore } from '../../../stores/user-store'
import Button from '../../../components/button'
import { CircleCheck } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import { useAuth } from '../../../context/auth-context'
import { Providers } from '../../../utils/types'
import { useState } from 'react'
import Loading from '../../../components/loading'
import tw from '../../../tw'

const providerOptions = [
  {
    title: 'Apple',
    provider: 'apple',
  },
  {
    title: 'Google',
    provider: 'google',
  },
] as const

const LinkedAccounts = () => {
  const { user } = useUserStore()
  const { linkAppleAccount, linkGoogleAccount } = useAuth()
  const [loading, setIsLoading] = useState(false)

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

  const renderedProviders = providerOptions.map(({ title, provider }) => {
    const isLinked = user?.providers.some((p) => p.name === provider)
    const providerEmail = user?.providers.find(
      (p) => p.name === provider
    )?.email

    return (
      <View key={provider}>
        <Txt twcn="text-lg font-medium mb-2">{title}</Txt>
        {isLinked ? (
          <View style={tw`flex-row items-center gap-4`}>
            <CircleCheck
              strokeWidth={1.5}
              color={Colors.success}
            />
            <Txt twcn="text-light-grayText dark:text-dark-grayText">
              {providerEmail}
            </Txt>
          </View>
        ) : (
          <Button
            text="Link Account"
            twcnText="font-medium text-primary dark:text-primary"
            onPress={() => handleLinking(provider)}
          />
        )}
      </View>
    )
  })

  return (
    <SafeView>
      <Txt twcn="text-light-grayText dark:text-dark-grayText mb-8">
        Securely link multiple sign-in providers (e.g., Apple and Google) to a
        single account, so you can log in with any of them.
      </Txt>
      <View style={tw`gap-8 mb-8`}>{renderedProviders}</View>
      <Loading
        visible={loading}
        label="Linking account..."
      />
    </SafeView>
  )
}

export default LinkedAccounts
