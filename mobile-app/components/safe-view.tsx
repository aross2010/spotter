import { ScrollView, View, ViewProps } from 'react-native'
import { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import tw from '../tw'
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-controller'

type SafeViewProps = {
  keyboardAvoiding?: boolean
  bottomOffset?: number
  extraKeyboardSpace?: number
  children: ReactNode
  hasTabBar?: boolean
  twcnContentView?: string
  hasHeader?: boolean
  scroll?: boolean
} & ViewProps

const SafeView = ({
  keyboardAvoiding,
  bottomOffset = 50,
  extraKeyboardSpace = 0,
  children,
  hasTabBar = false,
  twcnContentView,
  hasHeader = true,
  scroll = true,
  ...rest
}: SafeViewProps) => {
  const insets = useSafeAreaInsets()

  const paddingClasses = `px-4 ${!hasTabBar ? 'pb-12' : 'pb-4'} ${!hasHeader ? `pt-[${insets.top}px]` : 'pt-2'}`

  if (keyboardAvoiding && scroll) {
    return (
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        style={tw`flex-1 bg-light-background dark:bg-dark-background`}
        contentContainerStyle={tw`${paddingClasses} ${twcnContentView ?? ''}`}
        bottomOffset={bottomOffset}
        extraKeyboardSpace={extraKeyboardSpace}
      >
        {children}
      </KeyboardAwareScrollView>
    )
  }

  if (keyboardAvoiding && !scroll) {
    return (
      <View style={tw`flex-1 bg-light-background dark:bg-dark-background`}>
        <KeyboardAvoidingView
          behavior="padding"
          style={tw`flex-1`}
          keyboardVerticalOffset={100}
        >
          <View style={tw`flex-1 ${paddingClasses}`}>{children}</View>
        </KeyboardAvoidingView>
      </View>
    )
  }

  if (scroll) {
    return (
      <ScrollView
        style={tw`bg-light-background dark:bg-dark-background flex-1`}
        contentContainerStyle={tw`flex-grow ${paddingClasses} ${twcnContentView ?? ''}`}
        {...rest}
      >
        {children}
      </ScrollView>
    )
  }

  return (
    <View
      style={tw`flex-1 bg-light-background dark:bg-dark-background ${paddingClasses} ${twcnContentView ?? ''}`}
      {...rest}
    >
      {children}
    </View>
  )
}

export default SafeView
