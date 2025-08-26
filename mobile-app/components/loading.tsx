import React from 'react'
import { Modal, View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import Colors from '../constants/colors'
import Txt from './text'
import SafeView from './safe-view'

type LoadingProps = {
  visible: boolean
  fullScreen?: boolean
  label?: string
}

export default function Loading({
  visible,
  fullScreen,
  label = 'Loading…',
}: LoadingProps) {
  if (!visible) return null
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(0,0,0,0.25)',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <View className="p-4 rounded-lg">
          <ActivityIndicator
            size="large"
            color={Colors.light.grayText}
          />
          {!!label && (
            <Txt twcn="mt-2 text-light-grayText dark:text-dark-grayText text-sm">
              {label}
            </Txt>
          )}
        </View>
      </View>
    </Modal>
  )
}
