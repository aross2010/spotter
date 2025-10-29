// day (abbreviated). month, day, year
export const formattedDate = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export const formatDate = (date: Date | string) => {
  let dateObj: Date

  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number)
    dateObj = new Date(year, month - 1, day)
  } else {
    dateObj = date
  }

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Convert a Date object to YYYY-MM-DD string using local timezone
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
