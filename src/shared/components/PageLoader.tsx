import { Loader } from './Loader'

export function PageLoader() {
  return (
    <div className="page-loader">
      <Loader label="Loading page…" size="large" />
    </div>
  )
}
