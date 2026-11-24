import { StatusPage } from '../pages/StatusPage'

export function ServerErrorPage() {
  return (
    <StatusPage
      eyebrow="Something went wrong"
      code="500"
      title="We hit an unexpected error"
      description="The page could not be displayed right now. Please try again or return to the sign-in page."
      primaryAction={{ label: 'Try Login', to: '/login' }}
      secondaryAction={{ label: 'Go to dashboard', to: '/user/dashboard' }}
    />
  )
}
