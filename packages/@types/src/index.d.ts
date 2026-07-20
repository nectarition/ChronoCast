export type SuccessResult = {
  success: boolean
}

export type LoggedInUser = {
  isActive: boolean
}

export type AuthorizeURLResult = {
  url: string
}

export type AuthenticateResult = {
  loginToken: string
}

export type LoginResult = {
  apiToken: string
  user: LoggedInUser
}
