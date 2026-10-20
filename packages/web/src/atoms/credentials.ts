import { atom } from 'jotai'
import type { LoggedInUser } from 'chronocast'

const apiTokenAtom = atom<string | null>(null)
const userAtom = atom<LoggedInUser | null | undefined>(undefined)

export {
  apiTokenAtom,
  userAtom
}
