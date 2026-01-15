import { View, Image, useWindowDimensions } from 'react-native'
import React from 'react'
import Carousel from 'react-native-reanimated-carousel'
import { useSharedValue } from 'react-native-reanimated'
import tw from '../tw'
import Txt from './text'
import useTheme from '../app/hooks/theme'

type Feature = {
  imageDark: any
  imageLight: any
  title: string
  description: string
}

const features: Feature[] = [
  {
    imageDark: require('../assets/screenshots/workout-form-screenshot.png'),
    imageLight: require('../assets/screenshots/workout-form-screenshot-light.png'),
    title: 'Track Workouts',
    description:
      'Log sets, reps, partial reps, supersets, dropsets, intensity, and more with ease',
  },
  {
    imageDark: require('../assets/screenshots/workout-details-screenshot.png'),
    imageLight: require('../assets/screenshots/workout-details-screenshot-light.png'),
    title: 'Workout Details',
    description: 'Every necessary detail from every workout at your fingertips',
  },
  {
    imageDark: require('../assets/screenshots/exercise-details-screenshot.png'),
    imageLight: require('../assets/screenshots/exercise-details-screenshot-light.png'),
    title: 'Exercise Library',
    description:
      'Track and customize every exercise performed and monitor progress',
  },
  {
    imageDark: require('../assets/screenshots/insights-screenshot.png'),
    imageLight: require('../assets/screenshots/insights-screenshot-light.png'),
    title: 'Training Insights',
    description:
      'Analyze your training trends over time to maximize your workouts',
  },
  {
    imageDark: require('../assets/screenshots/notes-screenshot.png'),
    imageLight: require('../assets/screenshots/notes-screenshot-light.png'),
    title: 'Detailed Notes',
    description: 'Complement your workouts with rich, detailed note taking',
  },
  {
    imageDark: require('../assets/screenshots/weight-entry-screenshot.png'),
    imageLight: require('../assets/screenshots/weight-entry-screenshot-light.png'),
    title: 'Body Weight Tracking',
    description:
      'Monitor your body weight over time to take control of your physique',
  },
]

// Fixed height for title, description, and dots
const BOTTOM_CONTENT_HEIGHT = 100

const FeatureCarousel = () => {
  const { width } = useWindowDimensions()
  const { colorScheme } = useTheme()
  const progress = useSharedValue<number>(0)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [containerHeight, setContainerHeight] = React.useState(0)

  // Calculate image dimensions based on available height
  const imageAspectRatio = 0.46 // iPhone screenshot ratio (roughly 9:19.5)
  const availableHeightForCarousel =
    containerHeight - BOTTOM_CONTENT_HEIGHT - 64 // 64 = py-8 (32 top + 32 bottom)
  const visibleImageHeight = Math.max(availableHeightForCarousel * 0.95, 200) // 95% of available, min 200
  const imageWidth = (visibleImageHeight * imageAspectRatio) / 0.7 // Account for 30% crop, makes it wider
  const fullImageHeight = visibleImageHeight / 0.7 // Full height before crop (30% cut off)

  const renderItem = ({ item, index }: { item: Feature; index: number }) => {
    return (
      <View style={tw`items-center justify-center flex-1`}>
        {/* Outer border container */}
        <View
          style={{
            width: imageWidth + 4, // Account for border width
            height: visibleImageHeight + 2, // Only top border
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderTopWidth: 2,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderBottomWidth: 0,
            borderColor:
              colorScheme === 'dark'
                ? tw.color('dark-grayPrimary')
                : tw.color('light-grayPrimary'),
          }}
        >
          {/* Inner image container */}
          <View
            style={[
              tw`overflow-hidden`,
              {
                width: imageWidth,
                height: visibleImageHeight,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
              },
            ]}
          >
            <Image
              source={
                colorScheme === 'light' ? item.imageLight : item.imageDark
              }
              style={{
                width: '100%',
                height: fullImageHeight,
              }}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View
      style={tw`flex-1 py-8`}
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {containerHeight > 0 && (
        <View style={tw`flex-1 items-center`}>
          {/* Carousel takes remaining space */}
          <View style={tw`flex-1 w-full`}>
            <Carousel
              autoPlayInterval={4000}
              scrollAnimationDuration={800}
              data={features}
              loop={true}
              autoPlay
              pagingEnabled={true}
              snapEnabled={true}
              width={width}
              height={containerHeight - BOTTOM_CONTENT_HEIGHT - 64}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.85,
                parallaxScrollingOffset: 60,
              }}
              onProgressChange={(offsetProgress, absoluteProgress) => {
                progress.value = absoluteProgress
              }}
              onSnapToItem={(index) => setActiveIndex(index)}
              renderItem={renderItem}
            />
          </View>

          {/* Fixed bottom content: title, description, dots */}
          <View style={{ height: BOTTOM_CONTENT_HEIGHT }}>
            {/* Title and description - fixed height container */}
            <View style={[tw`px-12 items-center`, { height: 84 }]}>
              <Txt
                twcn="text-lg font-semibold text-light-text dark:text-dark-text text-center"
                numberOfLines={1}
              >
                {features[activeIndex].title}
              </Txt>
              <Txt
                twcn="text-sm text-light-grayText dark:text-dark-grayText text-center mt-1"
                numberOfLines={2}
              >
                {features[activeIndex].description}
              </Txt>
            </View>

            {/* Pagination dots - always at fixed position */}
            <View style={tw`flex-row gap-2 justify-center`}>
              {features.map((_, index) => (
                <View
                  key={index}
                  style={[
                    tw`h-2 rounded-full`,
                    {
                      width: activeIndex === index ? 20 : 8,
                      backgroundColor:
                        activeIndex === index
                          ? tw.color('primary')
                          : colorScheme === 'dark'
                            ? tw.color('dark-grayBorder')
                            : tw.color('light-grayBorder'),
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default FeatureCarousel
