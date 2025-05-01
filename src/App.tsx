import { createBrowserRouter, RouterProvider } from "react-router-dom"
import IndexPage from "./pages/IndexPage/IndexPage"

const router = createBrowserRouter([
  {
    index: true,
    element: <IndexPage />
  }
])

const App: React.FC = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default App
