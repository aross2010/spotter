export function formatNumber(num: number): string {
  // For numbers less than 100,000, add commas
  if (num < 100000) {
    return num.toLocaleString('en-US')
  }

  // For numbers 100,000 to 999,999, show as XXX.XK
  if (num < 1000000) {
    return (num / 1000).toFixed(1) + 'K'
  }

  // For numbers 1,000,000 and above, show as X.XM
  return (num / 1000000).toFixed(1) + 'M'
}
