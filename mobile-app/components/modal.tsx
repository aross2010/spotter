import {
  Platform,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
} from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import DragHandle from './drag-handle'

type ModalProps = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  children: React.ReactNode
}

// for non expo router modals, popups at bottom of the screen
const MyModal = ({ isOpen, setIsOpen, children }: ModalProps) => {
  return (
    <Modal
      isVisible={isOpen}
      swipeDirection={'down'}
      onBackdropPress={() => setIsOpen(false)}
      onSwipeComplete={() => setIsOpen(false)}
      useNativeDriver
      useNativeDriverForBackdrop={Platform.OS == 'android'}
      backdropOpacity={0.4}
      backdropTransitionOutTiming={1}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      hideModalContentWhileAnimating
      style={{ justifyContent: 'flex-end', margin: 0, position: 'relative' }}
      avoidKeyboard={true}
    >
      <View
        style={tw`bg-light-background dark:bg-dark-background rounded-t-xl px-4 pt-10 pb-12 gap-4 relative`}
      >
        <DragHandle />
        {children}
      </View>
    </Modal>
  )
}

export default MyModal
