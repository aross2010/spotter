import { View } from 'react-native'
import React from 'react'
import SafeView from './safe-view'
import Txt from './text'
import Button from './button'
import Colors from '../constants/colors'
import * as Updates from 'expo-updates'
import TextLogo from '../assets/spotter-text-logo.svg'

const Error = () => {
  const handleReload = async () => {
    await Updates.reloadAsync()
  }

  return (
    <SafeView
      scroll={false}
      twcnContentView="justify-center items-center px-6"
    >
      <View
        style={{
          height: 75,
          aspectRatio: 135 / 57,
          marginBottom: 36,
        }}
      >
        <TextLogo
          width={'100%'}
          height={'100%'}
          color={Colors.primary}
        />
      </View>

      <Txt twcn="text-center font-semibold text-2xl mb-3">Network Error</Txt>

      <Txt twcn="text-center text-light-grayText dark:text-dark-grayText mb-6 px-12 text-base">
        Could not load the requested content.
      </Txt>

      <Button
        text="Reload App"
        onPress={handleReload}
        twcn="px-12 py-3 bg-primary rounded-full"
        twcnText="font-semibold text-dark-text text-lg"
      />
    </SafeView>
  )
}

export default Error
