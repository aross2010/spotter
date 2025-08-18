import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'

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
      useNativeDriverForBackdrop
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={{ justifyContent: 'flex-end', margin: 0, position: 'relative' }}
    >
      {children}
    </Modal>
  )
}

export default MyModal

const styles = StyleSheet.create({})
