import { TextInput, Image, View, Pressable, ScrollView } from 'react-native'
import React, { useState } from 'react'
import type { KeyboardTypeOptions } from 'react-native'
import Txt from '../../components/text'
import AppleLogo from '../../assets/apple.png'
import GoogleLogo from '../../assets/google.png'
import SafeView from '../../components/safe-view'
import OrDivider from '../../components/or-divider'
import Input from '../../components/input'
import { Link } from 'expo-router'
import Button from '../../components/button'

const fields = [
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
    secureTextEntry: true,
  },
] as const

const SignUp = () => {
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const renderedNames = fields.slice(0, 2).map((field) => {
    return (
      <View
        key={field.name}
        className="flex flex-col gap-2 w-[48%]"
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

  const renderedAuthFields = fields.slice(2).map((field) => {
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
          <Txt>Sign Up with Apple</Txt>
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
          <Txt>Sign Up with Google</Txt>
        </Pressable>
      </View>
      <OrDivider />
      <ScrollView>
        <View className="flex-row items-center gap-4 mb-4">
          {renderedNames}
        </View>
        <View className="flex flex-col gap-4">{renderedAuthFields}</View>
        {data.password.length !== 0 && data.password.length < 8 && (
          <Txt className="text-xs mt-4 text-light-grayText dark:text-dark-grayText">
            Password must contain at least 8 characters (one uppercase AND one
            special character or number).
          </Txt>
        )}
      </ScrollView>
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
