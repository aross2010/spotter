import { View } from 'react-native'
import {
  EnrichedTextInput,
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched'
import SafeView from '../../../components/safe-view'
import Button from '../../../components/button'
import Txt from '../../../components/text'
import tw from '../../../tw'
import { router, useNavigation } from 'expo-router'
import Colors from '../../../constants/colors'
import { useState, useEffect, useRef } from 'react'
import { HeaderBackButton } from '@react-navigation/elements'
import {
  DefaultKeyboardToolbarTheme,
  KeyboardToolbar,
} from 'react-native-keyboard-controller'
import useTheme from '../../hooks/theme'
import SFIcon from '../../../components/sf-icon'
import { useWorkoutForm } from '../../../context/workout-form-context'

const WorkoutNotes = () => {
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const [isFocused, setIsFocused] = useState(false)
  const [stylesState, setStylesState] = useState<OnChangeStateEvent | null>(
    null
  )
  const bodyInputRef = useRef<EnrichedTextInputInstance>(null)
  const isInitialLoadRef = useRef(false)
  const navigation = useNavigation()
  const { theme, colorScheme } = useTheme()

  // Set the body content after data is loaded
  useEffect(() => {
    if (
      workoutData.notes &&
      bodyInputRef.current &&
      !isInitialLoadRef.current
    ) {
      isInitialLoadRef.current = true
      // Pass HTML to the editor, which will trigger onChangeText with plain text
      bodyInputRef.current?.setValue(workoutData.notes)
    }
  }, [workoutData.notes])

  useEffect(() => {
    navigation.setOptions({
      // headerRight: () => (
      //   <Button
      //     onPress={handleSave}
      //     hitSlop={12}
      //     accessibilityLabel="Save Notes"
      //     twcn="w-9 flex-row items-center justify-center h-full px-2"
      //   >
      //     <SFIcon
      //       name="checkmark"
      //       size={26}
      //       color={Colors.primary}
      //     />
      //   </Button>
      // ),
      headerLeft: () => (
        <View style={tw`flex-row items-center w-9`}>
          <HeaderBackButton
            displayMode="minimal"
            tintColor={theme.text}
            onPress={handleSave}
            style={tw`w-9 h-full`}
          />
        </View>
      ),
    })
  }, [navigation])

  const handleSave = async () => {
    const htmlBody = await bodyInputRef.current?.getHTML()
    setWorkoutData({
      ...workoutData,
      notes: htmlBody || workoutData.notes,
    })
    router.back()
  }

  return (
    <>
      <SafeView
        keyboardAvoiding
        scroll={false}
        keyboardVerticalOffset={75}
      >
        <View style={tw`flex-1`}>
          <EnrichedTextInput
            ref={bodyInputRef}
            onChangeState={(e) => setStylesState(e.nativeEvent)}
            onChangeText={(e) => {
              const newValue = e.nativeEvent.value
              if (newValue.trim().length <= 500) {
                setWorkoutData({
                  ...workoutData,
                  notes: newValue,
                })
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter workout notes here..."
            placeholderTextColor={
              colorScheme === 'dark'
                ? 'rgba(186, 186, 186, 0.75)'
                : 'rgba(116, 116, 116, 0.75)'
            }
            style={tw`dark:text-dark-text text-base flex-1 leading-[18] pt-2`}
            htmlStyle={{
              ul: {
                bulletColor: theme.text,
                gapWidth: 20,
              },
              ol: {
                gapWidth: 20,
              },
              a: {
                color: Colors.primary,
              },
            }}
            autoFocus
          />
        </View>
      </SafeView>
      <View
        collapsable={false}
        pointerEvents={isFocused ? 'auto' : 'none'}
        style={!isFocused ? { height: 0, opacity: 0 } : undefined}
      >
        <KeyboardToolbar
          theme={{
            ...DefaultKeyboardToolbarTheme,
            dark: {
              ...DefaultKeyboardToolbarTheme.dark,
              primary: Colors.dark.text,
              background: Colors.dark.background,
            },
            light: {
              ...DefaultKeyboardToolbarTheme.light,
              primary: Colors.light.text,
              background: Colors.light.background,
            },
          }}
        >
          <KeyboardToolbar.Content>
            <View
              style={tw`flex-row items-center justify-center gap-3 px-2 bg-white dark:bg-dark-grayPrimary rounded-full border border-light-grayBorder dark:border-dark-grayBorder`}
            >
              <View style={tw`flex-row items-center gap-4`}>
                <Button
                  onPress={() => bodyInputRef.current?.toggleBold()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="bold"
                    size={24}
                    color={stylesState?.isBold ? Colors.primary : theme.text}
                  />
                </Button>
                <Button
                  onPress={() => bodyInputRef.current?.toggleItalic()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="italic"
                    size={24}
                    color={stylesState?.isItalic ? Colors.primary : theme.text}
                  />
                </Button>
                <Button
                  onPress={() => bodyInputRef.current?.toggleUnderline()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="underline"
                    size={24}
                    color={
                      stylesState?.isUnderline ? Colors.primary : theme.text
                    }
                  />
                </Button>
                <Button
                  onPress={() => bodyInputRef.current?.toggleOrderedList()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="list.number"
                    size={24}
                    color={
                      stylesState?.isOrderedList ? Colors.primary : theme.text
                    }
                  />
                </Button>
                <Button
                  onPress={() => bodyInputRef.current?.toggleUnorderedList()}
                  twcn={`p-2`}
                >
                  <SFIcon
                    name="list.bullet"
                    size={24}
                    color={
                      stylesState?.isUnorderedList ? Colors.primary : theme.text
                    }
                  />
                </Button>
                <View style={tw`w-16`}>
                  <Txt
                    twcn={`text-xs ${
                      workoutData.notes.trim().length >= 500
                        ? 'text-red'
                        : 'dark:text-dark-grayText text-grayText'
                    }`}
                  >
                    {workoutData.notes.trim().length} / 500
                  </Txt>
                </View>
              </View>
            </View>
          </KeyboardToolbar.Content>
        </KeyboardToolbar>
      </View>
    </>
  )
}

export default WorkoutNotes
