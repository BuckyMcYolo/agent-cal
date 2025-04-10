export const getSessionToken = () => {
  if (typeof window === "undefined") {
    return null
  }
  const sessionToken = localStorage.getItem("sessionToken")
  if (!sessionToken) {
    return null
  }
  return sessionToken
}
