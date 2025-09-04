import { TextInput, TextInputProps, View, Pressable } from 'react-native'
import { useColorScheme } from 'react-native'
import Colors from '../constants/colors'
import Txt from './text'
import tw from '../tw'

type InputProps = {
  noBorder?: boolean
  twcnInput?: string
  label?: string
  twcnLabel?: string
  twcnContainer?: string
} & TextInputProps

const Input = ({
  noBorder,
  twcnInput,
  label,
  twcnLabel,
  twcnContainer,
  ...props
}: InputProps) => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light

  const getMultilineHeight = () => {
    if (props.numberOfLines) {
      const lineHeight = 20
      const padding = 24 // py-3 (12px top + 12px bottom)
      return lineHeight * props.numberOfLines + padding
    }
    return undefined
  }

  const standardInput = (
    <TextInput
      style={[
        tw`font-poppins font-light text-sm text-light-text dark:text-dark-text ${noBorder ? 'border-0 px-0 py-2 focus:border-0' : 'border border-light-graySecondary dark:border-dark-graySecondary focus:border-primary dark:focus:border-primary px-2 py-3'} rounded-lg ${props.editable ? '' : 'opacity-50'} ${twcnInput ?? ''}`,
        props.numberOfLines
          ? {
              height: getMultilineHeight(),
              textAlignVertical: 'top' as const,
            }
          : undefined,
      ]}
      placeholderTextColor={theme.grayText}
      multiline={props.numberOfLines ? true : props.multiline}
      {...props}
    />
  )

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
