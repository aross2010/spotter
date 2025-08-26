import { StyleSheet, ScrollView, TextInput } from 'react-native'
import SafeView from '../../components/safe-view'
import Button from '../../components/button'
import { formattedDate } from '../../functions/formatted-date'
import Input from '../../components/input'
import { View } from 'react-native'
import Txt from '../../components/text'
import tw from '../../tw'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { X, Plus, Tag } from 'lucide-react-native'
import Colors from '../../constants/colors'
import { useColorScheme, Pressable } from 'react-native'
import { useState, useEffect } from 'react'

const NotebookEntryForm = () => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light
  const [data, setData] = useState({
    date: new Date(),
    title: '',
    body: '',
    tags: [] as string[],
  })
  const { tags } = useLocalSearchParams()
  const navigation = useNavigation()
  const selectedTags = tags ? JSON.parse(tags as string) : []

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={handleSubmitEntry}
          hitSlop={12}
          accessibilityLabel="submit notebook entry"
          twcnText="font-poppinsSemiBold text-primary dark:text-primary"
          text="Save"
          disabled={data.body.trim().length < 1}
        />
      ),
    })
  }, [navigation])

  useEffect(() => {
    if (selectedTags.length > 0) {
      setData((prevData) => ({ ...prevData, tags: selectedTags }))
    }
  }, [tags])

  const handleSubmitEntry = async () => [
    console.log('Submit notebook entry', data),
  ]

  const renderedTags = data.tags.map((tag, index) => {
    return (
      <View
        key={tag}
        style={tw`bg-primary rounded-full px-2 py-0.5`}
      >
        <Txt twcn="text-xs text-light-background dark:text-light-background">
          {tag}
        </Txt>
      </View>
    )
  })

  return (
    <SafeView
      noScroll
      inModal
    >
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Button
            text={formattedDate}
            onPress={() => {
              console.log('Open date selector')
            }}
            twcn="w-fit"
            hitSlop={12}
            twcnText="text-xs font-poppinsMedium text-primary uppercase"
          />
        </View>

        <View style={tw`mb-4`}>
          <Input
            editable
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.nativeEvent.text })}
            placeholder="Entry title..."
            noBorder
            twcnInput="text-base font-poppinsMedium h-10"
          />
        </View>

        <View style={tw`flex-1 mb-4`}>
          <Input
            editable
            value={data.body}
            onChange={(e) => setData({ ...data, body: e.nativeEvent.text })}
            placeholder="Anything on your mind..."
            multiline
            noBorder
            twcnInput="flex-1 items-top"
          />
        </View>

        <View style={tw`mb-4`}>
          {data.tags.length > 0 ? (
            <>
              <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                Tags:
              </Txt>
              <Pressable
                onPress={() => {
                  router.push('/tag-selector')
                }}
                style={tw`flex-row gap-2 flex-wrap mb-2 py-4 border-b border-light-grayTertiary dark:border-dark-grayTertiary`}
              >
                {renderedTags}
              </Pressable>
            </>
          ) : (
            <View style={tw`gap-4`}>
              <Button
                onPress={() => {
                  router.push('/tag-selector')
                }}
                twcn="flex-row items-center justify-center p-4 border border-dashed border-light-grayTertiary dark:border-dark-grayTertiary rounded-lg"
                twcnText="text-light-grayText dark:text-dark-grayText text-sm "
                text="Add tags"
              >
                <Plus
                  size={16}
                  color={theme.grayText}
                  strokeWidth={1.5}
                />
              </Button>
            </View>
          )}
        </View>

        <View style={tw`flex-row gap-3`}>
          <Button
            text="Cancel"
            twcn="flex-1 border border-light-grayTertiary dark:border-dark-grayTertiary justify-center items-center rounded-full py-3"
            twcnText="text-light-grayText dark:text-dark-grayText font-poppinsMedium"
            onPress={() => router.back()}
          />
          <Button
            text="Save"
            twcn="flex-1 bg-primary justify-center items-center rounded-full py-3"
            twcnText="text-light-background font-poppinsMedium"
            onPress={() => {
              console.log('Save notebook entry')
            }}
          />
        </View>
      </View>
    </SafeView>
  )
}

export default NotebookEntryForm
