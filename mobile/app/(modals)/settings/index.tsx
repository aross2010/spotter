import { View, Alert, Linking, Share } from 'react-native'
import React from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { Link, router } from 'expo-router'
import useTheme from '../../hooks/theme'
import Button from '../../../components/button'
import { useAuth } from '../../../context/auth-context'
import tw from '../../../tw'
import * as StoreReview from 'expo-store-review'
import * as WebBrowser from 'expo-web-browser'
import { BASE_URL } from '../../../constants/auth'
import SFIcon from '../../../components/sf-icon'

const settingsData = [
  {
    sectionTitle: 'Account',
    options: [
      {
        label: 'Profile',
        onPress: () => {
          router.push('/settings/profile')
        },
      },
      {
        label: 'Linked Accounts',
        onPress: () => {
          router.push('/settings/linked-accounts')
        },
      },
    ],
  },
  {
    sectionTitle: 'User Experience',
    options: [
      {
        label: 'Preferences',
        onPress: () => {
          router.push('/settings/user-preferences')
        },
      },
    ],
  },
  {
    sectionTitle: 'Help & Support',
    options: [
      {
        label: 'Privacy Policy',
        onPress: async () => {
          await WebBrowser.openBrowserAsync(`${BASE_URL}/privacy`)
        },
      },
      {
        label: 'Terms of Service',
        onPress: async () => {
          await WebBrowser.openBrowserAsync(`${BASE_URL}/terms`)
        },
      },
      {
        label: 'Frequently Asked Questions',
        onPress: () => {
          router.push('/settings/faq')
        },
      },
      {
        label: 'Contact',
        onPress: async () => {
          const url = 'mailto:adross1027@gmail.com'
          const ok = await Linking.canOpenURL(url)
          if (ok) Linking.openURL(url)
          else Alert.alert('Error', 'Unable to open email client.')
        },
      },
    ],
  },
  {
    sectionTitle: 'Feedback & Sharing',
    options: [
      {
        label: '⭐  Rate the App',
        onPress: async () => {
          if (await StoreReview.isAvailableAsync()) {
            StoreReview.requestReview()
          }
        },
      },
      {
        label: '📤  Share the App',
        onPress: async () => {
          try {
            await Share.share({
              message:
                'Check out Spotter here: https://apps.apple.com/us/app/spotter-workout-tracker/id6754656428',
            })
          } catch (error) {
            Alert.alert('Error', 'Unable to share the app.')
          }
        },
      },
    ],
  },
  {
    sectionTitle: null,
    options: [
      {
        label: 'Sign Out',
        onPress: null,
      },
    ],
  },
]

const Settings = () => {
  const { theme } = useTheme()
  const { signOut, deleteAccount } = useAuth()

  const promptDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            Alert.alert(
              'Confirm Account Deletion',
              'This action is irreversible and will delete all your data.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteAccount()
                  },
                },
              ],
            )
          },
        },
      ],
    )
  }

  const promptSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: () => {
          router.back()
          signOut()
        },
      },
    ])
  }

  const renderedSettings = settingsData.map(
    ({ sectionTitle, options }, index) => {
      const currentSectionTitle = sectionTitle
      const nextSectionTitle =
        index + 1 < settingsData.length
          ? settingsData[index + 1].sectionTitle
          : null

      const needsBorderBottom = currentSectionTitle == nextSectionTitle
      return (
        <View
          style={tw`flex-col gap-2`}
          key={index}
        >
          {sectionTitle && (
            <Txt twcn="font-semibold text-lg">{sectionTitle}</Txt>
          )}
          <View
            style={tw`bg-white ${needsBorderBottom && sectionTitle != null ? 'border-b' : ''} border-light-grayBorder dark:border-dark-grayBorder dark:bg-dark-grayPrimary rounded-2xl flex-col`}
          >
            {options.map(({ label, onPress }, index) => {
              return (
                <Button
                  key={index}
                  onPress={onPress ? onPress : promptSignOut}
                  twcn={`flex-row items-center justify-between p-4 ${index === options.length - 1 ? '' : 'border-b border-light-grayBorder dark:border-dark-grayBorder'}`}
                >
                  <Txt>{label}</Txt>
                  <SFIcon
                    name="chevron.right"
                    size={16}
                    color={theme.grayText}
                  />
                </Button>
              )
            })}
          </View>
        </View>
      )
    },
  )

  return (
    <SafeView>
      <View style={tw`flex-col gap-8`}>{renderedSettings}</View>
      <View style={tw`flex-row justify-between mt-4`}>
        <Button
          onPress={promptDeleteAccount}
          style={tw`px-2`}
          text="Delete Account"
          twcnText="font-semibold text-light-grayText dark:text-dark-grayText"
        />
        <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs font-semibold px-2">
          Made by{' '}
          <Link href="https://aross.app">
            <Txt twcn="font-bold text-primary dark:text-primary ">me</Txt>
          </Link>
        </Txt>
      </View>
    </SafeView>
  )
}

export default Settings
