import { Pressable, View, StyleSheet } from 'react-native'
import { Image } from 'react-native'
import { useAuth } from '../context/auth-context'
import Txt from './text'

export function SignInWithAppleButton() {
  const { signInWithAppleWebBrowser } = useAuth()

  return (
    <Pressable onPress={signInWithAppleWebBrowser}>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/apple-icon.png')}
          style={styles.icon}
        />
        <Txt>Continue with Apple</Txt>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: '#000',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 6,
  },
})
