import { ScrollView, View, ViewProps } from 'react-native'
import { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import tw from '../tw'

type SafeViewProps = {
  children: ReactNode
  inModal?: boolean
  twcn?: string
  twcnInnerView?: string
  noHeader?: boolean
  noScroll?: boolean
} & ViewProps

const SafeView = ({
  children,
  inModal,
  twcn,
  twcnInnerView,
  noHeader,
  noScroll,
  ...rest
}: SafeViewProps) => {
  const insets = useSafeAreaInsets()

  // const styles = {
  //   paddingTop: noHeader ? insets.top : 16,
  //   paddingBottom: insets.bottom,
  //   flex: 1,
  //   paddingLeft: 16,
  //   paddingRight: 16,
  // }

  if (noScroll)
    return (
      <View
        style={tw.style(
          `bg-light-background dark:bg-dark-background flex-1`,
          twcn && `${twcn}`
        )}
        {...rest}
      >
        <View
          style={tw.style(
            `${noHeader ? 'pt-[${insets.top}px]' : 'pt-2'} pl-4 pr-4 ${inModal ? 'pb-12' : 'pb-4'} flex-1`,
            twcnInnerView ?? ''
          )}
        >
          {children}
        </View>
      </View>
    )

  return (
    <ScrollView
      style={tw.style(
        'bg-light-background dark:bg-dark-background flex-1',
        twcn && `${twcn}`
      )}
      {...rest}
    >
      <View
        style={tw.style(
          `${noHeader ? 'pt-[${insets.top}px]' : 'pt-2'} pb-4 pl-4 pr-4 flex-1`,
          twcnInnerView ?? ''
        )}
      >
        {children}
      </View>
    </ScrollView>
  )
}

export default SafeView
