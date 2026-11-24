import { createBrowserRouter } from 'react-router-dom'
import { RouteErrorPage } from '../shared/components/RouteErrorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Dashboard } = await import('../features/end-user/pages/Dashboard')
          return { Component: Dashboard }
        },
      },
    ],
  },
])