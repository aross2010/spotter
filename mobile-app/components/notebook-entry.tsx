import { StyleSheet, Text, View } from 'react-native'
import { NotebookEntry } from '../utils/types'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import { Fragment, useState } from 'react'
import { formatDate } from '../functions/formatted-date'
import { Ellipsis } from 'lucide-react-native'
import useTheme from '../app/hooks/theme'
import MyModal from './modal'
import NotebookEntryOptions from './notebook-entry-options'

type NotebookEntryProps = {
  entry: NotebookEntry
}

const NotebookEntryView = ({ entry }: NotebookEntryProps) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const { theme } = useTheme()
  const { id, date, title, body, tags } = entry

  return (
    <Fragment>
      <View
        style={tw`p-4 rounded-xl bg-white dark:bg-dark-grayPrimary relative overflow-hidden`}
      >
        <View
          style={tw`absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-l-xl`}
        />
        <View style={tw`flex-row justify-between flex-1 items-center`}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium">
            {formatDate(new Date(date))}
          </Txt>
          <Button
            hitSlop={12}
            onPress={() => setIsOptionsOpen(true)}
          >
            <Ellipsis
              size={20}
              color={theme.grayText}
            />
          </Button>
        </View>

        {title && <Txt twcn="font-poppinsMedium text-base">{title}</Txt>}
        <Txt twcn="text-sm mt-4">{body}</Txt>

        <View style={tw`mt-4 flex-row flex-wrap gap-2`}>
          {tags.map((tag) => {
            const { id, name } = tag
            return (
              <Txt
                key={id}
                twcn="text-xs rounded-full py-0.5 px-3 bg-primary/20 dark:bg-primary/50 text-primary"
              >
                #{name}
              </Txt>
            )
          })}
        </View>
      </View>
      <MyModal
        isOpen={isOptionsOpen}
        setIsOpen={setIsOptionsOpen}
      >
        <NotebookEntryOptions entry={entry} />
      </MyModal>
    </Fragment>
  )
}

export default NotebookEntryView
