import { TextInput, TextInputProps } from 'react-native'

type InputProps = {
  className?: string
} & TextInputProps

const Input = ({ className, ...props }: InputProps) => {
  return (
    <TextInput
      className={`font-poppins border border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg px-2 py-3 focus:border-primary ${className}`}
      {...props}
    />
  )
}

export default Input
