import { Pressable, View, Image } from 'react-native'
import Txt from './text'

export default function SignInWithGoogle({
  onPress,
  disabled,
}: {
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
    >
      <View
        style={{
          width: '100%',
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 5,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#ccc',
        }}
      >
        <Image
          source={require('../assets/google.png')}
          style={{
            width: 18,
            height: 18,
            marginRight: 6,
          }}
        />
        <Txt className="text-lg">Continue with Google</Txt>
      </View>
    </Pressable>
  )
}
