export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img src="/assets/logo.svg" alt="MessHunt" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span className="brand-name">Mess<span>Hunt</span></span>
        </div>
        <p>Student mess and accommodation discovery platform for Paschim Medinipur.</p>
      </div>
      <div className="footer-bottom">© 2026 MessHunt • Contact: <a className="inline-link" href="mailto:studentmesshunt@gmail.com">studentmesshunt@gmail.com</a></div>
    </footer>
  )
}
