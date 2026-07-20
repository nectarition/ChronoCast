const generateRandomString = (digit: number): string => {
  return Array.from({ length: digit }, () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    return chars.charAt(Math.floor(Math.random() * chars.length))
  }).join('')
}

export default generateRandomString
