import { View, Pressable } from 'react-native'
import { NotebookEntry } from '../utils/types'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import { Fragment, useState } from 'react'
import { formatDate } from '../functions/formatted-date'
import { Ellipsis, ChevronDown, ChevronUp, Tag } from 'lucide-react-native'
import useTheme from '../app/hooks/theme'
import MyModal from './modal'
import NotebookEntryOptions from './notebook-entry-options'
import Colors from '../constants/colors'
import TagView from './tag'

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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme } = useTheme()
  const { date, title, body, tags } = entry

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

  return (
    <Fragment>
      <View
        style={tw`p-4 ${roundTop ? 'rounded-t-2xl' : ''} ${roundBottom ? 'rounded-b-2xl' : ''} ${roundBottom ? '' : 'border-b border-light-grayBorder dark:border-dark-grayBorder'} bg-white dark:bg-dark-grayPrimary relative overflow-hidden`}
      >
        <View style={tw`flex-row justify-between flex-1 items-center`}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium tracking-wide">
            {formatDate(date)}
          </Txt>
          <Button
            hitSlop={12}
            onPress={() => setIsOptionsOpen(true)}
          >
            <Ellipsis
              size={24}
              color={theme.grayText}
            />
          </Button>
        </View>

        {title && <Txt twcn="font-poppinsMedium text-base">{title}</Txt>}

        <View style={tw`mt-2`}>
          <Txt twcn="text-sm leading-relaxed">{displayText}</Txt>

          {shouldTruncate && (
            <Pressable
              onPress={() => setIsExpanded(!isExpanded)}
              style={tw`flex-row items-center gap-1 mt-1 self-start`}
            >
              <Txt twcn="text-xs font-poppinsMedium text-primary">
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
      <MyModal
        isOpen={isOptionsOpen}
        setIsOpen={setIsOptionsOpen}
      >
        <NotebookEntryOptions
          setIsOptionsOpen={setIsOptionsOpen}
          entry={entry}
        />
      </MyModal>
    </Fragment>
  )
}

export default NotebookEntryView
