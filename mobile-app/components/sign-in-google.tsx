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
      className="w-full h-[52px] rounded-full justify-center bg-white border border-gray-300"
    >
      <View className="flex flex-row justify-center items-center">
        <Image
          source={require('../assets/google.png')}
          style={{
            width: 16,
            height: 16,
            marginRight: 6,
          }}
        />
        <Txt className="text-xl">Continue with Google</Txt>
      </View>
    </Pressable>
  )
}
