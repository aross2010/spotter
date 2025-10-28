import React, { useEffect, useState } from 'react'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import Input from '../../components/input'
import { useAuth } from '../../context/auth-context'
import { Tag } from '../../utils/types'
import Button from '../../components/button'
import { View } from 'react-native'
import tw from '../../tw'
import useTheme from '../hooks/theme'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import TagView from '../../components/tag'
import { Search, X } from 'lucide-react-native'

const TagSelector = () => {
  const { formTags, userTags } = useLocalSearchParams() as {
    formTags?: string // sent in from the form
    userTags?: string // JSON string of tags user has used in past
  }
  const [selectedTags, setSelectedTags] = useState<Tag[]>(
    formTags ? JSON.parse(formTags as string) : []
  )
  const [tagResults, setTagResults] = useState<(Tag & { used: number })[]>([])
  const [tags, setTags] = useState<(Tag & { used: number })[]>(
    userTags ? JSON.parse(userTags as string) : []
  )
  const [removedTags, setRemovedTags] = useState<(Tag & { used: number })[]>([])
  const [query, setQuery] = useState('')
  const { authUser } = useAuth()
  const navigation = useNavigation()
  const { theme } = useTheme()

  const handleSaveTags = () => {
    if (router.canGoBack()) {
      router.back()
      setTimeout(() => {
        router.setParams({ tags: JSON.stringify(selectedTags) })
      }, 100)
    }
  }

  useEffect(() => {
    // Don't set options if navigation isn't ready (e.g., when prefetching)
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.setOptions({
        headerRight: () => (
          <Button
            onPress={handleSaveTags}
            hitSlop={12}
            accessibilityLabel="save selected tags"
            twcnText="font-poppinsSemiBold text-primary dark:text-primary"
            text="Done"
          />
        ),
      })
    })

    return unsubscribe
  }, [navigation, selectedTags])

  useEffect(() => {
    if (!tags) return
    const filteredQueryResults = tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase()) &&
        !selectedTags.find((t) => t.name === tag.name)
    )
    console.log('filteredQueryResults', filteredQueryResults)
    setTagResults(filteredQueryResults)
  }, [query])

  useEffect(() => {
    if (!tags) return
    const filteredTags = tags.filter(
      (tag) =>
        !selectedTags.find((t) => t.name === tag.name) &&
        tag.name.toLowerCase().includes(query.toLowerCase())
    )
    setTagResults(filteredTags)
  }, [selectedTags, query])

  useEffect(() => {
    if (tags) {
      const filteredTags = tags.filter(
        (tag) => !selectedTags.find((t) => t.name === tag.name)
      )
      setTagResults(filteredTags)
    }
  }, [])

  const handleSelectTag = (tagName: string) => {
    // remove from tags so it cant be searched and add to removed in case it gets deselected
    setTags((prev) => prev.filter((tag) => tag.name !== tagName))
    setTagResults((prev) => prev.filter((tag) => tag.name !== tagName))
    setRemovedTags((prev) => [
      ...prev,
      tags.find((tag) => tag.name === tagName)!,
    ])
    const tag = tags.find((tag) => tag.name === tagName)!
    if (tag) setSelectedTags((prev) => [...prev, tag])
    setQuery('')
  }

  const handleCreateNewTag = () => {
    if (
      query.trim() === '' ||
      selectedTags.find((tag) => tag.name === query.trim()) ||
      tags.find((tag) => tag.name === query.trim()) ||
      removedTags.find((tag) => tag.name === query.trim())
    ) {
      setQuery('')
      return
    }

    // create new tag to selected tags
    const newTag = {
      id: Date.now().toString(),
      name: query.trim(),
      userId: authUser?.id ?? '',
    } // dummy id to match type
    setSelectedTags((prev) => [...prev, newTag])
    // do not add to tags (those are tags from database)
    setQuery('')
  }

  const handleDeselectTag = (tagName: string) => {
    // remove from selected tags, and add back to tags (find in removedTags)
    const isInRemovedTags = removedTags.find((tag) => tag.name === tagName)
    setSelectedTags((prev) => prev.filter((tag) => tag.name !== tagName))
    if (isInRemovedTags) {
      setTags((prev) => [...prev, isInRemovedTags])
    }
  }

  const renderedResults = tagResults.map(({ id, name, used }) => {
    return (
      <Button
        style={tw`border-b border-light-grayBorder dark:border-dark-grayBorder justify-between flex-row px-4 py-3 items-center`}
        key={id}
        onPress={() => handleSelectTag(name)}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Button>
    )
  })

  const renderedSelectedTags = selectedTags.map(({ id, name, userId }) => {
    return (
      <Button
        key={id}
        onPress={() => handleDeselectTag(name)}
        hitSlop={12}
      >
        <TagView tag={{ id, name, userId }} />
      </Button>
    )
  })

  return (
    <SafeView twcnContentView="px-0">
      <View
        style={tw`px-3 mx-4 mb-2 h-10 border border-light-grayBorder dark:border-dark-grayBorder rounded-xl flex-row items-center justify-between gap-2 bg-white`}
      >
        <Search
          size={16}
          color={theme.grayText}
        />
        <Input
          autoCorrect={false}
          twcnInput="flex-1"
          autoCapitalize="none"
          placeholder={tags.length === 0 ? 'Add tags...' : 'Search tags...'}
          value={query}
          onChange={(e) => setQuery(e.nativeEvent.text)}
          returnKeyType="done"
          onSubmitEditing={handleCreateNewTag}
          maxLength={50}
          autoFocus
        />
        <Button onPress={() => setQuery('')}>
          <X
            size={16}
            color={theme.grayText}
          />
        </Button>
      </View>

      {selectedTags.length > 0 && (
        <View
          style={tw`flex-row flex-wrap border-b border-light-grayBorder dark:border-dark-grayBorder pb-2 items-center gap-1 pt-2 px-4`}
        >
          {renderedSelectedTags}
        </View>
      )}
      <View>{renderedResults}</View>
    </SafeView>
  )
}

export default TagSelector
