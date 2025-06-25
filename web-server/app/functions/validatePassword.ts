const isValidPassword = (password: string): boolean => {
  const hasMinimumLength = password.length >= 8
  const hasMaximumLength = password.length <= 100
  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecialOrNumber = /[\W\d]/.test(password)

  return (
    hasMinimumLength && hasUppercase && hasSpecialOrNumber && hasMaximumLength
  )
}

export default isValidPassword
