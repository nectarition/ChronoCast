import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import CastPage from './pages/CastPage/CastPage'
import IndexPage from './pages/IndexPage/IndexPage'
import LoginPage from './pages/LoginPage/LoginPage'
import OIDCCallbackPage from './pages/OIDCCallbackPage/OIDCCallbackPage'
import AuthenticationProvider from './providers/AuthenticationProvider'

const Root: React.FC = () => {
  return (
    <AuthenticationProvider>
      <Outlet />
    </AuthenticationProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
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
    ]
  }
])

const App: React.FC = () => {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{ duration: 5000 }} />
    </>
  )
}

export default App
