import { Eye, EyeOff } from 'lucide-react-native'
import { TextInput, TextInputProps, View, Pressable } from 'react-native'
import { useColorScheme } from 'react-native'
import Colors from '../constants/colors'
import { useState } from 'react'
import Txt from './text'
import tw from '../tw'

type InputProps = {
  twcnInput?: string
  password?: boolean
  label?: string
  twcnLabel?: string
  twcnContainer?: string
} & TextInputProps

const Input = ({
  twcnInput,
  password,
  label,
  twcnLabel,
  twcnContainer,
  ...props
}: InputProps) => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light
  const [isTextVisible, setIsTextVisible] = useState(false)

  const standardInput = (
    <TextInput
      style={tw`font-poppins text-text dark:text-dark-text border border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg px-2 py-3 focus:border-primary dark:focus:border-primary ${props.editable ? '' : 'opacity-50'} ${twcnInput ?? ''}`}
      {...props}
    />
  )

  const passwordInput = (
    <View
      style={tw`px-2 border border-light-grayTertiary rounded-lg flex flex-row items-center gap-4`}
    >
      <TextInput
        secureTextEntry={!isTextVisible}
        style={tw`font-poppins flex-1 py-3 focus:border-primary ${props.editable ? '' : 'opacity-50'} ${twcnInput ?? ''}`}
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
        <View style={tw`flex flex-col gap-2 ${twcnContainer ?? ''}`}>
          <Txt twcn={`${props.editable ? '' : 'opacity-50'} ${twcnLabel}`}>
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
      <View style={tw`flex flex-col gap-2 ${twcnContainer ?? ''}`}>
        <Txt twcn={`${props.editable ? '' : 'opacity-50'} ${twcnLabel}`}>
          {label}
        </Txt>
        {standardInput}
      </View>
    )
  }

  return standardInput
}

export default Input
