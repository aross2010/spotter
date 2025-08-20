import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { View } from 'react-native'
import { useUserStore } from '../../../stores/user-store'
import Button from '../../../components/button'
import { CircleCheck, MailCheck } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import { useAuth } from '../../../context/auth-context'
import { Providers } from '../../../utils/types'
import { use, useState } from 'react'
import Loading from '../../../components/loading'

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
        <Txt className="text-lg font-poppinsMedium mb-2">{title}</Txt>
        {isLinked ? (
          <View className="flex-row items-center gap-4">
            <CircleCheck
              strokeWidth={1.5}
              color={Colors.success}
            />
            <Txt>{providerEmail}</Txt>
          </View>
        ) : (
          <Button
            text="Link Account"
            textClassName="font-poppinsSemiBold text-primary"
            onPress={() => handleLinking(provider)}
          />
        )}
      </View>
    )
  })

  return (
    <SafeView>
      <Txt className="text-light-grayText dark:text-dark-grayText mb-8">
        Spotter lets you securely link multiple sign-in providers (e.g., Apple
        and Google) to a single account, so you can securely log in with any of
        them. You may link accounts with different email addresses.
      </Txt>
      <View className="gap-6">{renderedProviders}</View>
      <Loading
        visible={loading}
        label="Linking account..."
      />
    </SafeView>
  )
}

export default LinkedAccounts
