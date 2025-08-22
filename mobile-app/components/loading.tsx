import React from 'react'
import { Modal, View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import Colors from '../constants/colors'
import Txt from './text'

export default function Loading({
  visible,
  label = 'Loading…',
}: {
  visible: boolean
  label?: string
}) {
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
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <View className="bg-grayTertiary p-4 rounded-lg">
          <ActivityIndicator
            size="large"
            color={Colors.light.grayText}
          />
          {!!label && <Txt className="mt-2 text-sm">{label}</Txt>}
        </View>
      </View>
    </Modal>
  )
}
