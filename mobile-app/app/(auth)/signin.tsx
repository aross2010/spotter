import {
  Pressable,
  KeyboardAvoidingView,
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
import OrDivider from '../../components/or-divider'
import { useAuth } from '../../context/auth-context'
import { SignInWithAppleIos } from '../../components/sign-in-apple.ios'
import SignInWithGoogle from '../../components/sign-in-google'

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
  const { signIn } = useAuth()
  const [data, setData] = useState({
    email: '',
    password: '',
  })

  const renderedFields = fields.map((field) => {
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
      <View className="flex flex-col gap-4">
        <SignInWithAppleIos />
        <SignInWithGoogle onPress={signIn} />
      </View>
      <OrDivider />
      <KeyboardAvoidingView>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="flex flex-col gap-4">{renderedFields}</View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View className="mt-auto">
        <Button
          onPress={() => console.log('Sign In')}
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
