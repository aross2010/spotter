import { StyleSheet } from 'react-native'
import SafeView from '../../components/safe-view'
import Button from '../../components/button'
import { formattedDate } from '../../functions/formatted-date'
import Input from '../../components/input'
import { View } from 'react-native'
import Txt from '../../components/text'

const NotebookEntryForm = () => {
  return (
    <SafeView>
      <Button
        text={formattedDate}
        onPress={() => {
          console.log('Open date selector')
        }}
        twcn="mb-4"
        twcnText="text-xs font-poppinsMedium uppercase text-primary"
      />
      <View className="flex-1 gap-4">
        <Input
          editable
          label="Title"
        />
        <Input
          editable
          label="Content"
          placeholder="What's on your mind?"
        />
        <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
          Tip: Add Tags to organize your entries
        </Txt>
        <Input
          editable
          label="Tags"
          placeholder="Search or generate tags..."
          twcnContainer="mt-auto"
        />
      </View>
      <Button
        text="Save"
        twcn="w-full mt-auto bg-primary justify-center items-center flex-row gap-2 rounded-full p-4"
        twcnText="text-light-background font-poppinsMedium text-base"
        onPress={() => {
          console.log('Save notebook entry')
        }}
      />
    </SafeView>
  )
}

export default NotebookEntryForm
