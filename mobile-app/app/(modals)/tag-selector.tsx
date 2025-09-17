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

  const handleSaveTags = () => {
    if (router.canGoBack()) {
      router.back()
      setTimeout(() => {
        router.setParams({ tags: JSON.stringify(selectedTags) })
      }, 100)
    }
  }

  useEffect(() => {
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
        style={tw`border-b border-light-grayTertiary dark:border-dark-grayTertiary justify-between flex-row px-2 py-3 items-center`}
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
    <SafeView scroll={false}>
      <Input
        autoCorrect={false}
        autoCapitalize="none"
        noBorder
        placeholder={tags.length === 0 ? 'Add tags...' : 'Search tags...'}
        value={query}
        onChange={(e) => setQuery(e.nativeEvent.text)}
        onSubmitEditing={handleCreateNewTag}
        returnKeyType="done"
      />
      {selectedTags.length > 0 && (
        <View style={tw`flex-row flex-wrap items-center gap-1 pt-2`}>
          {renderedSelectedTags}
        </View>
      )}
      <View
        style={tw`flex-col mt-2 border-t border-light-grayTertiary dark:border-dark-grayTertiary`}
      >
        {renderedResults}
      </View>
    </SafeView>
  )
}

export default TagSelector
