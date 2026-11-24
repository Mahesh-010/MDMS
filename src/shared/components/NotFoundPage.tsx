import { StatusPage } from '../pages/StatusPage'

export function NotFoundPage() {
  return (
    <StatusPage
      eyebrow="Page not found"
      code="404"
      title="We can’t find that page"
      description="The link may be incorrect, or the page may have moved."
      primaryAction={{ label: 'Go to Login', to: '/login' }}
      secondaryAction={{ label: 'Go to dashboard', to: '/user/dashboard' }}
    />
  )
}
