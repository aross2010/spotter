import React, { useEffect, useState } from 'react'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import Input from '../../components/input'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import { Tag } from '../../utils/types'
import Button from '../../components/button'
import { ActivityIndicator, Pressable, View } from 'react-native'
import tw from '../../tw'
import useTheme from '../hooks/theme'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'

const TagSelector = () => {
  const { existingTags } = useLocalSearchParams()
  const [selectedTags, setSelectedTags] = useState<Tag[]>(
    existingTags ? JSON.parse(existingTags as string) : []
  )
  const [tagResults, setTagResults] = useState<(Tag & { used: number })[]>([])
  const [tags, setTags] = useState<(Tag & { used: number })[]>([])
  const [removedTags, setRemovedTags] = useState<(Tag & { used: number })[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { fetchWithAuth, authUser } = useAuth()
  const { theme } = useTheme()
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
    const filteredQueryResults = tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase()) &&
        !selectedTags.find((t) => t.name === tag.name)
    )
    setTagResults(filteredQueryResults)
  }, [query])

  useEffect(() => {
    const filteredTags = tags.filter(
      (tag) =>
        !selectedTags.find((t) => t.name === tag.name) &&
        tag.name.toLowerCase().includes(query.toLowerCase())
    )
    setTagResults(filteredTags)
  }, [selectedTags, query])

  useEffect(() => {
    const getTags = async () => {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/notebookEntries/tags/${authUser?.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const tags = (await response.json()) as (Tag & { used: number })[]
      setTags(tags)
      const filteredTags = tags.filter(
        (tag) => !selectedTags.find((t) => t.name === tag.name)
      )
      setTagResults(filteredTags)
      setLoading(false)
    }
    getTags()
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
      <Pressable
        style={tw`border-b border-light-grayTertiary dark:border-dark-grayTertiary justify-between flex-row px-2 py-3 items-center`}
        key={id}
        onPress={() => handleSelectTag(name)}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Pressable>
    )
  })

  const renderedSelectedTags = selectedTags.map(({ id, name }) => {
    return (
      <Pressable
        key={id}
        onPress={() => handleDeselectTag(name)}
        style={tw`bg-primary dark:bg-primary rounded-full px-2 py-0.5`}
      >
        <Txt twcn="text-xs text-light-background dark:text-light-background">
          {name}
        </Txt>
      </Pressable>
    )
  })

  return (
    <SafeView
      noScroll
      inModal
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme.grayText}
        />
      ) : (
        <>
          <Input
            autoCorrect={false}
            autoCapitalize="none"
            noBorder
            placeholder="Search tags..."
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
        </>
      )}
    </SafeView>
  )
}

export default TagSelector
