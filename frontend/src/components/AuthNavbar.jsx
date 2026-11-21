export default function AuthNavbar({ rightLink = '/register.html', rightLabel = 'Register' }) {
  return (
    <header className="navbar">
      <a href="/index.html" className="brand" aria-label="MessHunt Home">
        <img
          src="/assets/logo.svg"
          alt="MessHunt"
          className="brand-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.nextElementSibling
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        <div className="brand-fallback" style={{ display: 'none' }}>
          <span className="brand-name">Mess<span>Hunt</span></span>
          <span className="brand-tagline">Find Your Perfect Mess</span>
        </div>
      </a>
      <div className="nav-actions"><a className="btn btn-light" href={rightLink}>{rightLabel}</a></div>
    </header>
  )
}
