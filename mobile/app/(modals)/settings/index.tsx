import { View, Alert, Linking } from 'react-native'
import React from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import useTheme from '../../hooks/theme'
import Button from '../../../components/button'
import { useAuth } from '../../../context/auth-context'
import { useUserStore } from '../../../stores/user-store'
import tw from '../../../tw'

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
        label: 'Frequently Asked Questions',
        onPress: () => {
          router.push('/settings/faq')
        },
      },
      {
        label: 'Contact',
        onPress: async () => {
          const url = 'mailto:support@spotter.com'
          const ok = await Linking.canOpenURL(url)
          if (ok) Linking.openURL(url)
          else Alert.alert('Error', 'Unable to open email client.')
        },
      },
      {
        label: 'Rate the App',
        onPress: () => {
          console.log('Rating App!')
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
              ]
            )
          },
        },
      ]
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
          style={tw`flex-col gap-4`}
          key={index}
        >
          {sectionTitle && <Txt twcn="font-poppinsMedium">{sectionTitle}</Txt>}
          <View
            style={tw`bg-white ${needsBorderBottom && index != settingsData.length - 1 ? 'border-b' : ''} border-light-grayBorder dark:border-dark-grayBorder dark:bg-dark-grayPrimary rounded-2xl flex-col`}
          >
            {options.map(({ label, onPress }, index) => {
              return (
                <Button
                  key={index}
                  onPress={onPress ? onPress : promptSignOut}
                  twcn={`flex-row items-center justify-between p-4 ${index === options.length - 1 ? '' : 'border-b border-light-grayBorder dark:border-dark-grayBorder'}`}
                >
                  <Txt twcn="font-poppinsRegular">{label}</Txt>
                  <ChevronRight
                    strokeWidth={1.5}
                    color={theme.grayText}
                  />
                </Button>
              )
            })}
          </View>
        </View>
      )
    }
  )

  return (
    <SafeView>
      <View style={tw`flex-col gap-8`}>{renderedSettings}</View>
      <View style={tw`flex-row justify-between mt-4`}>
        <Button
          onPress={promptDeleteAccount}
          style={tw`px-2 py-4`}
          text="Delete Account"
          twcnText="font-poppinsSemiBold text-light-grayText dark:text-dark-grayText"
        />
      </View>
    </SafeView>
  )
}

export default Settings
