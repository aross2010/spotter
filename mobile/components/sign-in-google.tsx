import { View, Image, Text } from 'react-native'
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
      style={tw`w-full h-[52px] rounded-full justify-center bg-white dark:bg-dark-grayPrimary border border-light-grayBorder dark:border-dark-grayBorder`}
    >
      <View
        style={tw`flex-row justify-center flex-1 items-center gap-1.5 text-center`}
      >
        <Image
          source={require('../assets/google.png')}
          style={{
            width: 16,
            height: 16,
          }}
        />
        <Text style={tw`text-xl`}>Continue with Google </Text>
      </View>
    </Button>
  )
}
