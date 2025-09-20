import { View, Alert, Linking } from 'react-native'
import React from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import useTheme from '../../../hooks/theme'
import Button from '../../../components/button'
import { useAuth } from '../../../context/auth-context'

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
        label: 'FAQ',
        onPress: () => {
          router.push('/settings/faq')
        },
      },
      {
        label: 'Contact Us',
        onPress: async () => {
          console.log('Contact Us Pressed')
          const url = 'mailto:support@spotter.com'
          console.log('Opening URL:', url)
          const ok = await Linking.canOpenURL(url)
          console.log('Can open URL:', ok)
          if (ok) Linking.openURL(url)
          else Alert.alert('Error', 'Unable to open email client.')
        },
      },
      {
        label: 'Version History',
        onPress: () => {
          router.push('/settings/version-history')
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
      return (
        <View
          style={tw`flex-col gap-4`}
          key={index}
        >
          {sectionTitle && (
            <Txt twcn="uppercase text-xs tracking-tight font-medium text-light-grayText dark:text-dark-grayText">
              {sectionTitle}
            </Txt>
          )}
          <View
            style={tw`bg-white border border-light-grayPrimary dark:border-dark-graySecondary dark:bg-dark-grayPrimary rounded-2xl flex-col`}
          >
            {options.map(({ label, onPress }, index) => {
              return (
                <Button
                  key={index}
                  onPress={onPress ? onPress : promptSignOut}
                  twcn="flex-row items-center justify-between p-4"
                  style={
                    index === options.length - 1
                      ? undefined
                      : tw`border-b border-light-grayPrimary dark:border-dark-graySecondary`
                  }
                >
                  <Txt>{label}</Txt>
                  <ChevronRight
                    strokeWidth={1.5}
                    color={theme.grayTertiary}
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
          twcnText="font-medium text-alert dark:text-alert"
        />
      </View>
    </SafeView>
  )
}

export default Settings
