import { Text, TextProps } from 'react-native'
import { ReactNode } from 'react'

type TxtProps = {
  children: ReactNode
  className?: string
} & TextProps

const Txt = ({ children, className, ...props }: TxtProps) => {
  return (
    <Text
      {...props}
      className={`font-poppins ${className}`}
    >
      {children}
    </Text>
  )
}

export default Txt
