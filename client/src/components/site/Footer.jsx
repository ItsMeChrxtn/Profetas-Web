import { Link } from 'react-router-dom';

export function Footer({ facebookUrl, shopeeUrl }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <h5 className="d-flex align-items-center gap-2">
              <img src="/logo.svg" alt="" width="24" height="24" />
              Profetas Integrated Farm
            </h5>
            <p className="small mb-1">Tres Cruces, Tanza, Cavite</p>
            <p className="small">Premium Quality, Naturally Grown mushrooms, mokusaku, mangoes, and farm inputs from our cooperative to your table.</p>
          </div>
          <div className="col-lg-2 col-md-4">
            <h5>Shop</h5>
            <p><Link to="/shop?category=Fresh">Fresh Produce</Link></p>
            <p><Link to="/shop?category=Value-Added">Value-Added</Link></p>
            <p><Link to="/shop?category=Farm+Inputs">Farm Inputs</Link></p>
            <p><Link to="/wholesale">Wholesale Inquiry</Link></p>
          </div>
          <div className="col-lg-2 col-md-4">
            <h5>Company</h5>
            <p><Link to="/education">Learn</Link></p>
            <p><Link to="/farm-visit">Visit the Farm</Link></p>
            <p><Link to="/track-order">Track Order</Link></p>
            <p><Link to="/faq">FAQs</Link></p>
          </div>
          <div className="col-lg-4 col-md-4">
            <h5>Connect With Us</h5>
            <p><a href={facebookUrl || '#'} target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook me-2" />Facebook Page</a></p>
            <p><a href={shopeeUrl || '#'} target="_blank" rel="noopener noreferrer"><i className="fas fa-shopping-bag me-2" />Shopee Store</a></p>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Profetas Integrated Farm &mdash; Undergraduate Capstone Project
        </div>
      </div>
    </footer>
  );
}
