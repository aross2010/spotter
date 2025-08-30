import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ActivityIndicator } from 'react-native'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import SafeView from './safe-view'

type SpinnerProps = {
  size?: 'small' | 'large'
  color?: string
  twcn?: string
  fullScreen?: boolean
}

const Spinner = ({
  size = 'small',
  color,
  twcn,
  fullScreen = true,
}: SpinnerProps) => {
  const { theme } = useTheme()

  const spinner = (
    <ActivityIndicator
      size={size}
      color={color || theme.grayText}
      style={tw`${twcn ?? ''}`}
    />
  )

  if (fullScreen) {
    return (
      <SafeView>
        <View style={tw`flex-1 justify-center items-center my-12`}>
          {spinner}
        </View>
      </SafeView>
    )
  }

  return spinner
}

export default Spinner

const styles = StyleSheet.create({})
