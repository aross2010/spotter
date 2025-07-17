import { LucideView } from 'lucide-react-native'
import { TextInput, TextInputProps, View } from 'react-native'
import { useColorScheme } from 'react-native'
import Colors from '../constants/colors'

type InputProps = {
  className?: string
  password?: boolean
} & TextInputProps

const Input = ({ className, password, ...props }: InputProps) => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light

  if (password)
    return (
      <View className="px-2 border border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg flex flex-row items-center gap-4">
        <TextInput
          secureTextEntry
          className={`font-poppins flex-1 py-3 focus:border-primary ${className}`}
          {...props}
        />
        <LucideView color={theme.grayTertiary} />
      </View>
    )

  return (
    <TextInput
      className={`font-poppins border border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg px-2 py-3 focus:border-primary ${className}`}
      {...props}
    />
  )
}

export default Input
