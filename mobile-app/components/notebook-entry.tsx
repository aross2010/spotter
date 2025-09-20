import { View, Pressable, Modal } from 'react-native'
import { NotebookEntry } from '../utils/types'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import { Fragment, useState } from 'react'
import { formatDate } from '../functions/formatted-date'
import {
  Ellipsis,
  ChevronDown,
  ChevronUp,
  Tag,
  Pencil,
  Pin,
  Trash,
  PinOff,
} from 'lucide-react-native'
import useTheme from '../hooks/theme'
import NotebookEntryOptions from './notebook-entry-options'
import Colors from '../constants/colors'
import DropdownMenu from './dropdown-menu'
import { useRouter } from 'expo-router'
import { useNotebook } from '../context/notebook-context'

type NotebookEntryProps = {
  entry: NotebookEntry
}

const NotebookEntryView = ({ entry }: NotebookEntryProps) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme } = useTheme()
  const { pinEntry, unpinEntry, deleteEntry } = useNotebook()
  const { date, title, body, tags, id, pinned } = entry
  const router = useRouter()

  const CHARACTER_LIMIT = 400
  const shouldTruncate = body.length > CHARACTER_LIMIT
  const displayText =
    shouldTruncate && !isExpanded
      ? body.substring(0, CHARACTER_LIMIT).trim() + '...'
      : body

  const handlePinToggle = async () => {
    if (pinned) await unpinEntry(id)
    else await pinEntry(id)
    setIsOptionsOpen(false)
  }

  const handleEdit = () => {
    router.push({
      pathname: '/notebook-entry-form',
      params: {
        entryId: id,
        entryTitle: title || '',
        entryBody: body,
        entryDate: date,
        entryTags: JSON.stringify(tags),
      },
    })
  }
  const handleDelete = () => {
    deleteEntry(id)
  }

  const renderedTags = tags.map((tag) => {
    const { id, name } = tag
    return (
      <Txt
        key={id}
        twcn="text-xs text-primary"
      >
        #{name}
      </Txt>
    )
  })

  return (
    <Fragment>
      <View
        style={tw`p-4 rounded-2xl bg-white dark:bg-dark-grayPrimary relative`}
      >
        <View style={tw`flex-row justify-between flex-1 items-center`}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-medium">
            {formatDate(date)}
          </Txt>
          <DropdownMenu
            options={[
              {
                label: pinned ? 'Unpin' : 'Pin',
                icon: pinned ? PinOff : Pin,
                onPress: handlePinToggle,
                type: 'button',
              },
              {
                label: 'Edit',
                icon: Pencil,
                onPress: handleEdit,
                type: 'button',
              },
              {
                label: 'Delete',
                icon: Trash,
                onPress: () => handleDelete,
                type: 'button',
                destructive: true,
              },
            ]}
            triggerIcon={Ellipsis}
          />
        </View>

        {title && <Txt twcn="font-medium text-base">{title}</Txt>}

        <View style={tw`mt-2`}>
          <Txt twcn="text-sm leading-relaxed">{displayText}</Txt>

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
