
import { Link } from "react-router-dom";

function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-label">
            PASAR LELANG ONLINE
          </p>

          <h1>
            Temukan barangnya.
            <br />
            Ajukan tawaranmu.
          </h1>

          <p className="hero-description">
            Jelajahi berbagai barang menarik, bersaing
            dengan penawar lain, dan menangkan barang
            yang kamu inginkan.
          </p>

          <Link to="/auctions">
            <button className="hero-button">
              Jelajahi Lelang →
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;
