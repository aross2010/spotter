import { StyleSheet, View, Animated } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import tw from '../tw'
import Button from './button'
import Txt from './text'
import { GlassView } from 'expo-glass-effect'

type SelectorProps = {
  onSelect: (value: string) => void
  options: { label: string; value: string }[]
  selectedValue: string
}

const Selector = ({ onSelect, options, selectedValue }: SelectorProps) => {
  const selectedIndex = options.findIndex(
    (option) => option.value === selectedValue
  )
  const animatedValue = useRef(new Animated.Value(selectedIndex)).current
  const [buttonLayouts, setButtonLayouts] = useState<
    { x: number; width: number }[]
  >([])

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: selectedIndex,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start()
  }, [selectedIndex])

  const handleButtonLayout = (index: number, x: number, width: number) => {
    setButtonLayouts((prev) => {
      const newLayouts = [...prev]
      newLayouts[index] = { x, width }
      return newLayouts
    })
  }

  const translateX =
    buttonLayouts.length === options.length
      ? animatedValue.interpolate({
          inputRange: options.map((_, i) => i),
          outputRange: buttonLayouts.map((layout) => layout.x),
        })
      : 0

  const animatedWidth =
    buttonLayouts.length === options.length
      ? animatedValue.interpolate({
          inputRange: options.map((_, i) => i),
          outputRange: buttonLayouts.map((layout) => layout.width),
        })
      : 0

  const renderedOptions = options.map((option, index) => {
    const isSelected = option.value === selectedValue
    return (
      <View
        key={option.value}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout
          handleButtonLayout(index, x, width)
        }}
      >
        <Button
          onPress={() => onSelect(option.value)}
          style={tw`py-2 px-3 rounded-xl`}
        >
          <Txt
            twcn={`text-xs text-light-grayText dark:text-dark-grayText ${isSelected ? 'text-primary dark:text-dark-text' : ''}`}
          >
            {option.label}
          </Txt>
        </Button>
      </View>
    )
  })

  return (
    <GlassView
      style={tw`flex-row self-start items-center overflow-hidden bg-white dark:bg-dark-grayPrimary rounded-full relative`}
    >
      {buttonLayouts.length === options.length && (
        <Animated.View
          style={[
            tw`absolute bg-primary/25 rounded-lg dark:bg-primary/75`,
            {
              width: animatedWidth,
              height: '100%',
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {renderedOptions}
    </GlassView>
  )
}

export default Selector

const styles = StyleSheet.create({})
