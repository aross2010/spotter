import { Text, Pressable, PressableProps } from 'react-native'
import React, { ReactNode } from 'react'

type ButtonProps = {
  children?: ReactNode
  text?: string
  textClassName?: string
  className?: string
  loading?: boolean
} & PressableProps

const Button = ({
  children,
  text,
  textClassName,
  className,
  loading,
  ...props
}: ButtonProps) => {
  if (text) {
    return (
      <Pressable
        className={`active:opacity-75 disabled:opacity-50 ${className}`}
        {...props}
      >
        <Text className={`${textClassName}`}>
          {loading ? 'Loading...' : text}
        </Text>
        {children}
      </Pressable>
    )
  }

  return (
    <Pressable
      className={`active:opacity-75 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </Pressable>
  )
}

export default Button
