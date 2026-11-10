import { Link } from 'react-router-dom';

export default function Logo({ light = false }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo--light' : ''}`} aria-label="VedaTax home">
      <img src="/vedatax-mark.jpeg" alt="" className="logo__mark" width="44" height="44" />
      <span className="logo__text">
        <span className="logo__word"><span className="logo__veda">VEDA</span><span className="logo__tax">TAX</span></span>
        <span className="logo__tag">Simplify <i>•</i> Plan <i>•</i> Grow</span>
      </span>
    </Link>
  );
}
