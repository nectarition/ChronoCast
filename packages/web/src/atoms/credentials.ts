import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { LoggedInUser } from 'chronocast'

const loginTokenKey = 'chronocast_loginToken'
const loginTokenAtom = atomWithStorage<string | null>(loginTokenKey, null)

const apiTokenAtom = atom<string | null>(null)
const userAtom = atom<LoggedInUser | null | undefined>(undefined)

export {
  loginTokenKey,
  loginTokenAtom,
  apiTokenAtom,
  userAtom
}
