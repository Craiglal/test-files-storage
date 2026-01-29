import { GoogleButton } from './GoogleButton'
import './AuthPage.scss'

type AuthPageProps = {
  googleAuthUrl: string
}

export function AuthPage({ googleAuthUrl }: AuthPageProps) {
  return (
    <div className="page auth-page">
      <div className="card">
        <header className="card__header">
          <h1 className="brand">File Storage</h1>
        </header>

        <div className="card__body">
          <h2 className="headline">Sign In/Sing up</h2>

          <GoogleButton href={googleAuthUrl}>Sign up with Google</GoogleButton>

          <a className="help-link" href="#">Need help?</a>
        </div>
      </div>
    </div>
  )
}
