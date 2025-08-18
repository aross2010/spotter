import { View, Text, Pressable, Alert, Linking } from 'react-native'
import React from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import useTheme from '../../../context/theme'

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
      {
        label: 'Sign Out',
        onPress: () => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'OK',
              onPress: () => {
                router.push('/sign-out')
              },
            },
          ])
        },
      },
      {
        label: 'Delete Account',
        onPress: () => {
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
                    'Are you sure you want to delete your account?',
                    'This action is irreversible and will delete all your data.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'OK',
                        onPress: () => {
                          router.push('/delete-account')
                        },
                      },
                    ]
                  )
                },
              },
            ]
          )
        },
      },
    ],
  },
  {
    sectionTitle: 'User Experience',
    options: [
      {
        label: 'Theme',
        onPress: () => {
          router.push('/settings/theme-selector')
        },
      },
      {
        label: 'Workout Preferences', // weight (lbs or kg), intensity (rpe, rir)
        onPress: () => {
          router.push('/settings/workout-preferences')
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
]

const Settings = () => {
  const { theme } = useTheme()

  const renderedSettings = settingsData.map(
    ({ sectionTitle, options }, index) => {
      return (
        <View
          className="flex-col gap-4"
          key={index}
        >
          <Txt className="text-lg font-poppinsMedium">{sectionTitle}</Txt>
          <View className="bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-lg flex-col">
            {options.map(({ label, onPress }, index) => {
              return (
                <Pressable
                  key={index}
                  onPress={onPress}
                  className={`flex-row items-center justify-between p-4 ${index === options.length - 1 ? '' : 'border-b border-light-graySecondary dark:border-dark-graySecondary'}`}
                >
                  <Txt className="text-base font-poppinsRegular">{label}</Txt>
                  <ChevronRight
                    strokeWidth={1.5}
                    color={theme.grayText}
                  />
                </Pressable>
              )
            })}
          </View>
        </View>
      )
    }
  )

  return (
    <SafeView>
      <View className="flex-col gap-8">{renderedSettings}</View>
    </SafeView>
  )
}

export default Settings
