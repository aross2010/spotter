import {
  CheckCircle,
  CircleAlert,
  CircleCheck,
  XCircle,
} from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import Txt from '../components/text'
import { View } from 'react-native'
import Colors from '../constants/colors'

export const toast = (
  type: 'mySuccess' | 'myError',
  header: string,
  text: string
) => {
  Toast.show({
    type,
    props: { header, text },
    topOffset: 55,
    autoHide: false,
    onPress: () => {
      Toast.hide()
    },
    swipeable: true,
  })
}

export const toastConfig = {
  mySuccess: ({ props }: { props: { header: string; text: string } }) => (
    <View className="w-full px-4">
      <View className="relative w-full px-4 py-4 bg-success/20 rounded-lg flex-row gap-3 items-center overflow-hidden border border-success/50">
        <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-success" />
        <CircleCheck color={Colors.success} />
        <View className="flex-col gap-0.5 flex-1">
          <Txt className="font-poppinsSemiBold ">{props.header}</Txt>
          <Txt className="text-sm">{props.text}</Txt>
        </View>
      </View>
    </View>
  ),

  myError: ({ props }: { props: { header: string; text: string } }) => (
    <View className="w-full px-4">
      <View className="relative w-full px-4 py-4 bg-alert/15 rounded-lg flex-row gap-3 items-center overflow-hidden border border-alert/50">
        <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-alert" />
        <CircleAlert color={Colors.alert} />
        <View className="flex-col gap-0.5 flex-1">
          <Txt className="font-poppinsSemiBold ">{props.header}</Txt>
          <Txt className="text-sm ">{props.text}</Txt>
        </View>
      </View>
    </View>
  ),
}
