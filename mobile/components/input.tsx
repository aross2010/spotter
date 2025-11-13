import { TextInput, TextInputProps, View, Pressable } from 'react-native'
import { useColorScheme } from 'react-native'
import { forwardRef } from 'react'
import Colors from '../constants/colors'
import Txt from './text'
import tw from '../tw'
import useTheme from '../app/hooks/theme'

type InputProps = {
  fullBorder?: boolean
  twcnInput?: string
  label?: string
  twcnLabel?: string
  twcnContainer?: string
  searchInput?: boolean
} & TextInputProps

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      fullBorder,
      twcnInput,
      label,
      twcnLabel,
      twcnContainer,
      searchInput,
      ...props
    },
    ref
  ) => {
    const { colorScheme, theme } = useTheme()

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
        ref={ref}
        style={[
          tw`font-poppins text-sm text-light-text dark:text-dark-text py-2 ${fullBorder ? 'bg-white dark:bg-dark-grayPrimary border border-light-grayBorder dark:border-dark-grayBorder rounded-xl p-2.5' : ''} ${twcnInput ?? ''}`,
          props.numberOfLines
            ? {
                height: getMultilineHeight(),
                textAlignVertical: 'top' as const,
                lineHeight: 20,
              }
            : undefined,
        ]}
        placeholderTextColor={theme.grayText}
        keyboardAppearance={colorScheme}
        multiline={props.numberOfLines ? true : props.multiline}
        {...props}
      />
    )

    if (label) {
      return (
        <View style={tw`gap-2 ${twcnContainer ?? ''}`}>
          <Txt twcn={`font-poppinsMedium ${twcnLabel}`}>{label}</Txt>
          {standardInput}
        </View>
      )
    }

    return standardInput
  }
)

export default Input
