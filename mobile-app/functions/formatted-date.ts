// day (abbreviated). month, day, year
export const formattedDate = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
