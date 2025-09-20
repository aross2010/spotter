import React, { Fragment, useEffect, useState } from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useAuth } from '../../../context/auth-context'
import Input from '../../../components/input'
import { Alert, View } from 'react-native'
import Button from '../../../components/button'
import { BASE_URL } from '../../../constants/auth'
import { toast } from '../../../utils/toast'
import { useUserStore } from '../../../stores/user-store'
import { tokenCache } from '../../../utils/cache'
import { useNavigation } from 'expo-router'
import { Check } from 'lucide-react-native'
import Colors from '../../../constants/colors'

const profileFields = [
  {
    name: 'firstName',
    label: 'First Name',
    keyboardType: 'default',
    autoCapitalize: 'words',
    maxLength: 75,
  },
  {
    name: 'lastName',
    label: 'Last Name',
    keyboardType: 'default',
    autoCapitalize: 'words',
    maxLength: 75,
  },
  {
    name: 'email',
    label: 'Email',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
    maxLength: 150,
  },
] as const

const Profile = () => {
  const { fetchWithAuth } = useAuth()
  const { user, setUser } = useUserStore()
  const [userData, setUserData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  })
  const [loading, setLoading] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <Button
            onPress={updateProfile}
            hitSlop={12}
            accessibilityLabel="apply filters and sort method"
            disabled={!canSubmit || loading}
          >
            <Check
              size={36}
              color={Colors.primary}
            />
          </Button>
        )
      },
    })
  }, [userData, canSubmit])

  useEffect(() => {
    const hasChanges =
      user?.firstName !== userData.firstName ||
      user?.lastName !== userData.lastName ||
      user?.email !== userData.email
    if (hasChanges) setCanSubmit(true)
    else setCanSubmit(false)
  }, [userData])

  const updateProfile = async () => {
    // ensure that user data is valid and has been changed
    setLoading(true)
    try {
      const userDataWithoutEmail = {
        firstName: userData.firstName,
        lastName: userData.lastName,
      }
      const response = await fetchWithAuth(
        `${BASE_URL}/api/users/${user?.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(userDataWithoutEmail),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const updatedUser = (await response.json()) as {
        firstName: string
        lastName: string
      }
      if (user)
        setUser({
          ...user,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        })
      Alert.alert(
        'Profile Updated',
        'Your profile has been successfully updated!'
      )
      setCanSubmit(false)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast('myError', 'Error Updating Profile', error.response.data.error)
    } finally {
      setLoading(false)
    }
  }

  const renderedFields = profileFields.map((field, index) => {
    return (
      <Fragment key={field.name}>
        <Input
          key={index}
          value={userData[field.name]}
          onChangeText={(text) =>
            setUserData({ ...userData, [field.name]: text })
          }
          editable={field.name !== 'email'}
          {...field}
        />
      </Fragment>
    )
  })

  return (
    <SafeView
      scroll={false}
      keyboardAvoiding
    >
      <View className="flex-col gap-4">{renderedFields}</View>
    </SafeView>
  )
}

export default Profile
