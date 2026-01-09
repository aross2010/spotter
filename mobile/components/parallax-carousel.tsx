import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React from 'react'
import Carousel from 'react-native-reanimated-carousel'

import { useSharedValue } from 'react-native-reanimated'
import tw from '../tw'

type ParallaxCarouselProps = {
  items: React.ReactNode[]
  data: any[]
}

const { width } = Dimensions.get('window')

const ParallaxCarousel = ({ items, data }: ParallaxCarouselProps) => {
  const progress = useSharedValue<number>(0)

  const renderItem = ({
    item,
    index,
  }: {
    item: any
    index: number
    animationValue: any
  }) => {
    return <>{items[index]}</>
  }

  return (
    <Carousel
      autoPlayInterval={5000}
      scrollAnimationDuration={1000}
      data={data}
      loop={true}
      autoPlay
      pagingEnabled={true}
      snapEnabled={true}
      width={width}
      height={150}
      mode="parallax"
      modeConfig={{
        parallaxScrollingScale: 0.9,
        parallaxScrollingOffset: 50,
      }}
      style={tw`overflow-visible justify-center items-center`}
      onProgressChange={(offsetProgress, absoluteProgress) => {
        progress.value = absoluteProgress
      }}
      renderItem={renderItem}
    />
  )
}

export default ParallaxCarousel

const styles = StyleSheet.create({})
