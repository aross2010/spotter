import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '../context/auth-context'

export function SignInWithAppleIos() {
  const { signInWithApple } = useAuth()

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={5}
      style={{ width: '100%', height: 48 }}
      onPress={signInWithApple}
    />
  )
}
