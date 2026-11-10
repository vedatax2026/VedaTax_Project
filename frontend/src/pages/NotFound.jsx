import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="eyebrow">404</p>
        <h1 className="section__title">Page not found</h1>
        <p className="muted">The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="btn btn--navy">Back to home</Link>
      </div>
    </section>
  );
}
