import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import CastPage from './pages/CastPage/CastPage'
import IndexPage from './pages/IndexPage/IndexPage'
import LoginPage from './pages/LoginPage/LoginPage'
import OIDCCallbackPage from './pages/OIDCCallbackPage/OIDCCallbackPage'
import AuthenticationProvider from './providers/AuthenticationProvider'

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
    element: <IndexPage />
  },
  {
    path: 'folders/:folderKey',
    element: <CastPage />
  }
])

const App: React.FC = () => {
  return (
    <AuthenticationProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{ duration: 5000 }} />
      <RouterProvider router={router} />
    </AuthenticationProvider>
  )
}

export default App
