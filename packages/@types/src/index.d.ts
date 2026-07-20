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

export type Source = {
  id: number
  folderKey: string
  name: string
}

export type Schedule = {
  id: number
  sourceId: number
  scheduledAt: Date
}
