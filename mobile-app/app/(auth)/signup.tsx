import {
  View,
  Pressable,
  Image,
  KeyboardTypeOptions,
  ScrollView,
} from 'react-native'
import { useState } from 'react'
import { Link } from 'expo-router'
import { KeyboardAvoidingView } from 'react-native'
import Txt from '../../components/text'
import AppleLogo from '../../assets/apple.png'
import GoogleLogo from '../../assets/google.png'
import OrDivider from '../../components/or-divider'
import Input from '../../components/input'
import Button from '../../components/button'
import SafeView from '../../components/safe-view'
import { CircleAlert, CircleCheck } from 'lucide-react-native'
import Colors from '../../constants/colors'
import isValidPassword from '../../functions/validatePassword'

const inputFields = [
  {
    name: 'firstName',
    label: 'First Name',
    autoCorrect: false,
    autoCapitalize: 'words',
  },
  {
    name: 'lastName',
    label: 'Last Name',
    autoCorrect: false,
    autoCapitalize: 'words',
  },
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

const SignUp = () => {
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const renderedNameFields = inputFields.slice(0, 2).map((field) => {
    return (
      <Input
        containerClassName="w-[48%]"
        key={field.name}
        {...field}
        value={data[field.name]}
        onChangeText={(text) => setData({ ...data, [field.name]: text })}
      />
    )
  })

  const renderedAuthFields = inputFields.slice(2).map((field) => {
    return (
      <Input
        key={field.name}
        {...field}
        value={data[field.name]}
        onChangeText={(text) => setData({ ...data, [field.name]: text })}
      />
    )
  })

  return (
    <SafeView noScroll>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={100}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4">
            <Pressable
              className="flex flex-row justify-center gap-2 bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-lg py-5 px-8 items-center"
              onPress={() => console.log('Apple Auth')}
            >
              <Image
                source={AppleLogo}
                className="w-7 h-7"
                resizeMode="contain"
              />
              <Txt>Sign Up with Apple</Txt>
            </Pressable>
            <Pressable
              className="flex flex-row justify-center gap-2 bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-lg py-5 px-8 items-center"
              onPress={() => console.log('Apple Auth')}
            >
              <Image
                source={GoogleLogo}
                className="w-7 h-7"
                resizeMode="contain"
              />
              <Txt>Sign Up with Google</Txt>
            </Pressable>
          </View>
          <OrDivider />
          <View className="gap-6">
            <View className="flex-row justify-between">
              {renderedNameFields}
            </View>
            <View className="flex flex-col gap-2">{renderedAuthFields}</View>
          </View>
          <View className="mt-2 flex-row items-center gap-2">
            {data.password.length == 0 ? (
              <CircleAlert color={Colors.warn} />
            ) : data.password.length > 0 && !isValidPassword(data.password) ? (
              <CircleAlert color={Colors.alert} />
            ) : (
              <CircleCheck color={Colors.success} />
            )}
            <Txt className="text-xs text-light-grayText dark:text-dark-grayText flex-1">
              Password must be at least 8 characters long, contain one uppercase
              letter, and at least one special character or number.
            </Txt>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View className="mt-auto">
        <Txt className="text-xs text-center text-light-grayText dark:text-dark-grayText mb-2">
          By signing up, you agree to our{' '}
          <Link
            href="https://lift.log/terms"
            className="underline"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="https://lift.log/privacy"
            className="underline"
          >
            Privacy Policy
          </Link>
          .
        </Txt>
        <Button
          onPress={() => console.log('Sign Up')}
          textClassName="text-dark-text font-poppinsBold"
          className="w-full flex flex-row bg-primary rounded-full py-5 px-8 items-center justify-center"
        >
          Sign Up
        </Button>
      </View>
    </SafeView>
  )
}

export default SignUp
