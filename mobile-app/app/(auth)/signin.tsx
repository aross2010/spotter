import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  Image,
  ScrollView,
  KeyboardTypeOptions,
  View,
} from 'react-native'
import { useState, useContext } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import Input from '../../components/input'
import Button from '../../components/button'
import AppleLogo from '../../assets/apple.png'
import GoogleLogo from '../../assets/google.png'
import OrDivider from '../../components/or-divider'
import { Link } from 'expo-router'
import { AuthContext } from '../../utils/auth-context'

const fields = [
  {
    name: 'email',
    label: 'Email',
    autoCorrect: false,
    keyboardType: 'email-address' as KeyboardTypeOptions,
  },
  {
    name: 'password',
    label: 'Password',
    autoCorrect: false,
    password: true,
  },
] as const

const SignIn = () => {
  const authState = useContext(AuthContext)

  const [data, setData] = useState({
    email: '',
    password: '',
  })

  const renderedFields = fields.map((field) => {
    return (
      <View
        key={field.name}
        className="flex flex-col gap-2"
      >
        <Txt>{field.label}</Txt>
        <Input
          {...field}
          value={data[field.name]}
          onChangeText={(text) => setData({ ...data, [field.name]: text })}
        />
      </View>
    )
  })

  return (
    <SafeView noScroll>
      <View className="flex flex-col gap-4">
        <Pressable
          className="flex flex-row justify-center gap-2 bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-lg py-4 px-8 items-center"
          onPress={() => console.log('Apple Auth')}
        >
          <Image
            source={AppleLogo}
            className="w-7 h-7"
            resizeMode="contain"
          />
          <Txt>Sign In with Apple</Txt>
        </Pressable>
        <Pressable
          className="flex flex-row justify-center gap-2 bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-lg py-4 px-8 items-center"
          onPress={() => console.log('Apple Auth')}
        >
          <Image
            source={GoogleLogo}
            className="w-7 h-7"
            resizeMode="contain"
          />
          <Txt>Sign In with Google</Txt>
        </Pressable>
      </View>
      <OrDivider />
      <ScrollView>
        <View className="flex flex-col gap-4">{renderedFields}</View>
      </ScrollView>
      <View className="mt-auto">
        <Button
          onPress={() => authState.logIn(data)}
          textClassName="text-dark-text font-poppinsBold"
          className="w-full flex flex-row bg-primary rounded-full py-5 px-8 items-center justify-center"
        >
          Sign In
        </Button>
      </View>
    </SafeView>
  )
}

export default SignIn
