import { View } from 'react-native'
import React, { Fragment } from 'react'
import { NotebookEntry } from '../utils/types'
import { Pencil, Pin, Trash, Calendar, Tag, PinOff } from 'lucide-react-native'
import Colors from '../constants/colors'
import tw from '../tw'
import Txt from './text'
import { formatDate } from '../functions/formatted-date'
import useTheme from '../app/hooks/theme'
import Button from './button'
import { useNotebook } from '../context/notebook-context'
import { router } from 'expo-router'

type NotebookEntryOptionsProps = {
  entry: NotebookEntry
  setIsOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const NotebookEntryOptions = ({
  entry,
  setIsOptionsOpen,
}: NotebookEntryOptionsProps) => {
  const { theme } = useTheme()
  const { pinEntry, unpinEntry, deleteEntry } = useNotebook()
  const { pinned, title, body, tags, id, date } = entry

  const handlePinToggle = async () => {
    if (pinned) await unpinEntry(id)
    else await pinEntry(id)
    setIsOptionsOpen(false)
  }

  const handleEdit = () => {
    setIsOptionsOpen(false)
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

  const options = [
    {
      title: pinned ? 'Unpin' : 'Pin',
      description: pinned
        ? 'Remove this entry from the top'
        : 'Keep this entry at the top',
      onPress: handlePinToggle,
      icon: pinned ? PinOff : Pin,
    },
    {
      title: 'Edit',
      description: 'Modify title, content, or tags',
      onPress: handleEdit,
      icon: Pencil,
    },
    {
      title: 'Delete',
      description: 'Remove this entry permanently',
      onPress: () => {
        deleteEntry(id)
        setIsOptionsOpen(false)
      },
      icon: Trash,
    },
  ]

  const renderedOptions = options.map(
    ({ title, description, onPress, icon: Icon }, index) => {
      return (
        <Button
          onPress={onPress}
          key={index}
        >
          <View
            key={index}
            style={tw`flex-row gap-6 p-3 items-center rounded-xl`}
          >
            <View style={tw`bg-primary/10 rounded-xl p-2`}>
              <Icon
                size={20}
                color={Colors.primary}
                strokeWidth={1.5}
              />
            </View>
            <View style={tw`flex-1`}>
              <Txt twcn="text-base mb-0.5">{title}</Txt>
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                {description}
              </Txt>
            </View>
          </View>
        </Button>
      )
    }
  )

  const renderedTags = tags.length > 0 && (
    <View style={tw`flex-row items-center gap-2 mt-3`}>
      <Tag
        size={12}
        color={theme.grayText}
      />
      <View style={tw`flex-row flex-wrap gap-1`}>
        {tags.slice(0, 3).map((tag, index) => (
          <Txt
            key={tag.id}
            twcn="text-xs text-primary font-poppinsMedium"
          >
            #{tag.name}
          </Txt>
        ))}
        {tags.length > 3 && (
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
            +{tags.length - 3} more
          </Txt>
        )}
      </View>
    </View>
  )

  return (
    <Fragment>
      <View
        style={tw`px-2 pb-4 border-b border-light-graySecondary dark:border-dark-graySecondary`}
      >
        <View style={tw`flex-row items-center gap-2 mb-2`}>
          <Calendar
            size={14}
            color={theme.grayText}
          />
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium">
            {formatDate(date)}
          </Txt>
        </View>

        {title && (
          <Txt twcn="text-lg font-poppinsSemiBold text-light-text dark:text-dark-text mb-2">
            {title}
          </Txt>
        )}

        <Txt
          twcn="text-sm text-light-grayText dark:text-dark-grayText leading-relaxed"
          numberOfLines={2}
        >
          {body}
        </Txt>

        {renderedTags}
      </View>

      <View>
        <Txt twcn="text-xs uppercase font-poppinsMedium text-light-grayText dark:text-dark-grayText mb-3 px-2 tracking-wide">
          Actions
        </Txt>
        <View style={tw``}>{renderedOptions}</View>
      </View>
    </Fragment>
  )
}

export default NotebookEntryOptions
