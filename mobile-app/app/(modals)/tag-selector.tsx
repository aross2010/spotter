import React, { useEffect, useState } from 'react'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import Input from '../../components/input'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import { UsedTags } from '../../utils/types'
import Button from '../../components/button'
import { ActivityIndicator, Pressable, View } from 'react-native'
import tw from '../../tw'
import Loading from '../../components/loading'
import useTheme from '../hooks/theme'
import { router, useNavigation } from 'expo-router'

const TagSelector = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [usedTags, setUsedTags] = useState<UsedTags[]>([])
  const [results, setResults] = useState<UsedTags[]>([])
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
          text="Save"
        />
      ),
    })
  }, [navigation, selectedTags])

  useEffect(() => {
    const usedAndSelected = usedTags.filter(
      (tag) => !selectedTags.includes(tag.name)
    )
    const filtered = usedAndSelected.filter((tag) =>
      tag.name.toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered)
  }, [query])

  useEffect(() => {
    // fetch user tags - can change route based on if notebook or workout tags
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
      const tags = await response.json()
      setUsedTags(tags)
      setResults(tags)
      setLoading(false)
    }
    getTags()
  }, [])

  const handleSelectTag = (tagName: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((name) => name !== tagName)
      }
      return [...prev, tagName]
    })
    setUsedTags((prev) => {
      if (prev.find((tag) => tag.name === tagName)) {
        return prev.filter((tag) => tag.name !== tagName)
      }
      return prev
    })
    setResults((prev) => {
      if (prev.find((tag) => tag.name === tagName)) {
        return prev.filter((tag) => tag.name !== tagName)
      }
      return prev
    })
    setQuery('')
  }

  const handleCreateNewTag = () => {
    const trimmedQuery = query.trim()
    if (trimmedQuery && !selectedTags.includes(trimmedQuery)) {
      handleSelectTag(trimmedQuery)
    }
  }

  const handleDeselectTag = (tagName: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((name) => name !== tagName)
      }
      return prev
    })
    setUsedTags((prev) => {
      if (prev.find((tag) => tag.name === tagName)) {
        return prev.filter((tag) => tag.name !== tagName)
      }
      return prev
    })
    setResults((prev) => {
      if (prev.find((tag) => tag.name === tagName)) {
        return prev.filter((tag) => tag.name !== tagName)
      }
      return [...prev, usedTags.find((tag) => tag.name === tagName)!]
    })
    setQuery('')
  }

  const renderedResults = results.map((tag) => {
    return (
      <Pressable
        style={tw`border-b border-light-grayTertiary dark:border-dark-grayTertiary justify-between flex-row px-2 py-3 items-center`}
        key={tag.id}
        onPress={() => handleSelectTag(tag.name)}
      >
        <Txt>{tag.name}</Txt>
        <Txt>{tag.used}</Txt>
      </Pressable>
    )
  })

  const renderedSelectedTags = selectedTags.map((tag) => {
    return (
      <Pressable
        key={tag}
        onPress={() => handleDeselectTag(tag)}
        style={tw`bg-primary dark:bg-primary rounded-full px-2 py-0.5`}
      >
        <Txt twcn="text-xs text-light-background dark:text-light-background">
          {tag}
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
