import { User } from '../libs/types'

export const sendSignupEmail = async (user: User) => {
  console.log(`Sending signup email to ${user.email}`)
}
