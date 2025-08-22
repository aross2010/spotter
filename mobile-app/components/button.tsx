import { Text, Pressable, PressableProps } from 'react-native'
import React, { ReactNode } from 'react'
import Txt from './text'
import tw from '../tw'

type ButtonProps = {
  children?: ReactNode
  text?: string
  twcnText?: string
  twcn?: string
  loading?: boolean
} & PressableProps

const Button = ({
  children,
  text,
  twcnText,
  twcn,
  loading,
  ...props
}: ButtonProps) => {
  if (text) {
    return (
      <Pressable
        style={tw`active:opacity-75 disabled:opacity-50 ${twcn ?? ''}`}
        {...props}
      >
        <Txt twcn={twcnText}>{loading ? 'Loading...' : text}</Txt>
        {children}
      </Pressable>
    )
  }

  return (
    <Pressable
      style={tw`active:opacity-75 disabled:opacity-50 ${twcn ?? ''}`}
      {...props}
    >
      {children}
    </Pressable>
  )
}

export default Button
