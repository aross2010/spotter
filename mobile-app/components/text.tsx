import { Text, TextProps } from 'react-native'
import { ReactNode } from 'react'
import tw from '../tw'

type TxtProps = {
  children: ReactNode
  twcn?: string
} & TextProps

const Txt = ({ children, twcn, ...props }: TxtProps) => {
  return (
    <Text
      {...props}
      style={tw.style('light:text-light-text dark:text-dark-text', twcn ?? '')}
    >
      {children}
    </Text>
  )
}

export default Txt
