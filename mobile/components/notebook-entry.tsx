import { View, Pressable, useWindowDimensions } from 'react-native'
import { NotebookEntry } from '../utils/types'
import tw from '../tw'
import Txt from './text'
import { Fragment, useState } from 'react'
import { formatDate } from '../functions/formatted-date'
import { ChevronDown, ChevronUp, Tag } from 'lucide-react-native'
import useTheme from '../app/hooks/theme'
import Colors from '../constants/colors'
import TagView from './tag'
import RenderHtml from 'react-native-render-html'
import { ContextMenu, Host, Button as SwiftButton } from '@expo/ui/swift-ui'
import { useNotebook } from '../context/notebook-context'
import { router } from 'expo-router'
import SFIcon from './sf-icon'

type NotebookEntryProps = {
  entry: NotebookEntry
  roundTop: boolean
  roundBottom: boolean
}

const NotebookEntryView = ({
  entry,
  roundTop,
  roundBottom,
}: NotebookEntryProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme, colorScheme } = useTheme()
  const { width } = useWindowDimensions()
  const { date, title, body, tags, pinned, id } = entry
  const { pinEntry, unpinEntry, deleteEntry } = useNotebook()

  const CHARACTER_LIMIT = 400
  const shouldTruncate = body.length > CHARACTER_LIMIT
  const displayText =
    shouldTruncate && !isExpanded
      ? body.substring(0, CHARACTER_LIMIT).trim() + '...'
      : body

  const renderedTags = tags.map((tag) => {
    const { id, name } = tag
    return (
      <TagView
        key={id}
        tag={tag}
      />
    )
  })

  const handlePinToggle = async () => {
    if (pinned) await unpinEntry(id)
    else await pinEntry(id)
  }

  const handleEdit = () => {
    router.push({
      pathname: '/notebook-entry-form',
      params: {
        entryId: id,
      },
    })
  }

  const handleDelete = async () => {
    await deleteEntry(id)
  }

  return (
    <Fragment>
      <View
        style={tw`p-4 ${roundTop ? 'rounded-t-2xl' : ''} ${roundBottom ? 'rounded-b-2xl mb-2' : ''} ${roundBottom ? '' : 'border-b border-light-grayBorder dark:border-dark-grayBorder'} bg-white dark:bg-dark-grayPrimary relative overflow-hidden`}
      >
        <View style={tw`flex-row justify-between flex-1 items-center`}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-medium ">
            {formatDate(date)}
          </Txt>
          <Host style={{ width: 26, height: 26 }}>
            <ContextMenu>
              <ContextMenu.Items>
                <SwiftButton
                  systemImage="pin"
                  onPress={handlePinToggle}
                >
                  {pinned ? 'Unpin' : 'Pin'}
                </SwiftButton>
                <SwiftButton
                  systemImage="pencil"
                  onPress={handleEdit}
                >
                  Edit
                </SwiftButton>
                <SwiftButton
                  systemImage="trash"
                  onPress={handleDelete}
                >
                  Delete
                </SwiftButton>
              </ContextMenu.Items>
              <ContextMenu.Trigger>
                <SFIcon
                  name="ellipsis"
                  color={theme.text}
                  size={26}
                />
              </ContextMenu.Trigger>
            </ContextMenu>
          </Host>
        </View>

        {title && <Txt twcn="font-semibold text-lg">{title}</Txt>}

        <View style={tw`mt-2`}>
          <RenderHtml
            contentWidth={width - 32}
            source={{ html: displayText }}
            baseStyle={{
              color: theme.text,
              fontSize: 14,
              lineHeight: 18,
            }}
            enableExperimentalBRCollapsing
            tagsStyles={{
              p: { marginTop: 0, marginBottom: 0 },
              ul: { marginTop: 0, marginBottom: 0, paddingLeft: 20 },
              ol: { marginTop: 0, marginBottom: 0, paddingLeft: 20 },
              li: {
                paddingLeft: 6,
                paddingBottom: 0,
                paddingTop: 0,
              },
              strong: { fontWeight: 'bold' },
              b: { fontWeight: 'bold' },
              em: { fontStyle: 'italic' },
              i: { fontStyle: 'italic' },
              u: { textDecorationLine: 'underline' },
              a: { color: Colors.primary, fontWeight: 'bold' },
            }}
          />

          {shouldTruncate && (
            <Pressable
              onPress={() => setIsExpanded(!isExpanded)}
              style={tw`flex-row items-center gap-1 mt-1 self-start`}
            >
              <Txt twcn="text-xs font-medium text-primary">
                {isExpanded ? 'Show less' : 'Show more'}
              </Txt>
              {isExpanded ? (
                <ChevronUp
                  size={14}
                  color={Colors.primary}
                />
              ) : (
                <ChevronDown
                  size={14}
                  color={Colors.primary}
                />
              )}
            </Pressable>
          )}
        </View>
        {tags.length > 0 && (
          <View style={tw`mt-4 flex-row flex-wrap items-center gap-2`}>
            <Tag
              color={Colors.primary}
              strokeWidth={1.5}
              size={12}
            />
            {renderedTags}
          </View>
        )}
      </View>
    </Fragment>
  )
}

export default NotebookEntryView
