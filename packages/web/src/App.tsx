import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CastPage from './pages/CastPage/CastPage'
import LoginPage from './pages/LoginPage/LoginPage'
import AuthenticationProvider from './providers/AuthenticationProvider'
import OIDCCallbackPage from './pages/OIDCCallbackPage/OIDCCallbackPage'
import FolderSelectPage from './pages/FolderSelectPage/FolderSelectPage'

const router = createBrowserRouter([
  {
    path: 'login',
    element: <LoginPage />
  },
  {
    path: 'oidc/callback',
    element: <OIDCCallbackPage />
  },
  {
    index: true,
    element: <FolderSelectPage />
  },
  {
    path: 'folders/:folderKey',
    element: <CastPage />
  }
])

const App: React.FC = () => {
  return (
    <AuthenticationProvider>
      <RouterProvider router={router} />
    </AuthenticationProvider>
  )
}

export default App
