import './HomePage.scss'

export function HomePage() {
  return (
    <div className="page home">
      <div className="home__nav">Home</div>
      <main className="home__content">
        <h1>Welcome back</h1>
        <p className="muted">You are signed in. Add your content here.</p>
      </main>
    </div>
  )
}
