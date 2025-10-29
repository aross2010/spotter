export const capString = (str: string, maxLength: number): string => {
  if (!str) return ''

  if (!str || str.length <= maxLength) {
    return str
  }

  return `${str.substring(0, maxLength)}...`
}

// make every word in string start with uppercase
export const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}
