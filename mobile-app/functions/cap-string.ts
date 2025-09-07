export const capString = (str: string, maxLength: number): string => {
  if (!str) return ''

  if (!str || str.length <= maxLength) {
    return str
  }

  return `${str.substring(0, maxLength)}...`
}
