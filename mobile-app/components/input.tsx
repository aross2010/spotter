import { Eye, EyeOff } from 'lucide-react-native'
import { TextInput, TextInputProps, View, Pressable } from 'react-native'
import { useColorScheme } from 'react-native'
import Colors from '../constants/colors'
import { useState } from 'react'
import Txt from './text'

type InputProps = {
  className?: string
  password?: boolean
  label?: string
  labelClassName?: string
  containerClassName?: string
} & TextInputProps

const Input = ({
  className,
  password,
  label,
  labelClassName,
  containerClassName,
  ...props
}: InputProps) => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light
  const [isTextVisible, setIsTextVisible] = useState(false)

  const standardInput = (
    <TextInput
      className={`font-poppins border border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg px-2 py-3 focus:border-primary ${props.editable ? '' : 'opacity-50'} ${className}`}
      {...props}
    />
  )

  const passwordInput = (
    <View className="px-2 border border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg flex flex-row items-center gap-4">
      <TextInput
        secureTextEntry={!isTextVisible}
        className={`font-poppins flex-1 py-3 focus:border-primary ${props.editable ? '' : 'opacity-50'} ${className}`}
        {...props}
      />
      <Pressable
        onPress={() => {
          setIsTextVisible(!isTextVisible)
        }}
      >
        {isTextVisible ? (
          <Eye color={theme.grayTertiary} />
        ) : (
          <EyeOff color={theme.grayTertiary} />
        )}
      </Pressable>
    </View>
  )

  if (password) {
    if (label) {
      return (
        <View className={`flex flex-col gap-2 ${containerClassName}`}>
          <Txt
            className={`${props.editable ? '' : 'opacity-50'} ${labelClassName}`}
          >
            {label}
          </Txt>
          {passwordInput}
        </View>
      )
    } else {
      return passwordInput
    }
  }

  if (label) {
    return (
      <View className={`flex flex-col gap-2 ${containerClassName}`}>
        <Txt
          className={`${props.editable ? '' : 'opacity-50'} ${labelClassName}`}
        >
          {label}
        </Txt>
        {standardInput}
      </View>
    )
  }

  return standardInput
}

export default Input
