import { Pressable, View, Image } from 'react-native'
import Txt from './text'
import tw from '../tw'
import Button from './button'

export default function SignInWithGoogle({
  onPress,
  disabled,
}: {
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      style={tw`w-full h-[52px] rounded-full justify-center bg-white dark:bg-dark-grayPrimary border border-gray-300`}
    >
      <View style={tw`flex flex-row justify-center items-center`}>
        <Image
          source={require('../assets/google.png')}
          style={{
            width: 16,
            height: 16,
            marginRight: 6,
          }}
        />
        <Txt twcn="text-lg">Continue with Google</Txt>
      </View>
    </Button>
  )
}
