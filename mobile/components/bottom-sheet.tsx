import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { ReactNode, RefObject, useCallback } from 'react'
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import tw from '../tw'
import useTheme from '../app/hooks/theme'

type BottomSheetProps = {
  children: ReactNode
  ref: RefObject<BottomSheetModal | null>
  usesKeyboard?: boolean
  onDismiss?: () => void
  scroll?: boolean
}

const MyBottomSheet = ({
  children,
  ref,
  usesKeyboard = false,
  onDismiss,
  scroll = false,
}: BottomSheetProps) => {
  const { theme } = useTheme()
  const backDrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        onPress={() => Keyboard.dismiss()}
      />
    ),
    [],
  )
  return (
    <BottomSheetModal
      ref={ref}
      handleIndicatorStyle={tw`bg-light-grayText dark:bg-dark-grayText w-12`}
      backgroundStyle={{
        backgroundColor: theme.background,
      }}
      enablePanDownToClose
      onDismiss={onDismiss}
      backdropComponent={backDrop}
    >
      {scroll ? (
        <BottomSheetScrollView
          style={tw`bg-light-background dark:bg-dark-background relative ${usesKeyboard ? 'p-4' : 'pt-4 pb-12 px-4'}`}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView
          style={tw`bg-light-background dark:bg-dark-background relative ${usesKeyboard ? 'p-4' : 'pt-4 pb-12 px-4'}`}
        >
          {children}
        </BottomSheetView>
      )}
    </BottomSheetModal>
  )
}

export default MyBottomSheet

const styles = StyleSheet.create({})
