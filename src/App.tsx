import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { getFirebaseApp } from './libs/FirebaseApp'
import CastPage from './pages/CastPage/CastPage'
import LoginPage from './pages/LoginPage/LoginPage'
import PocPage from './pages/PocPage/PocPage'

getFirebaseApp()

const router = createBrowserRouter([
  {
    path: 'cast/:folderId',
    element: <CastPage />
  },
  {
    path: 'poc',
    element: <PocPage />
  },
  {
    path: 'login',
    element: <LoginPage />
  }
])

const App: React.FC = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default App
