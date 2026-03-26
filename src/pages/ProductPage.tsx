import { useParams, Link, useNavigate } from "react-router-dom";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import { getProductById, getCurrentUser, createOrder } from "@/lib/store";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = getProductById(id || "");
  const user = getCurrentUser();

  if (!product) return (
    <div><RetroHeader /><div className="retro-page"><h1>PRODUCT NOT FOUND</h1><p>This listing does not exist or has been removed.</p></div><RetroFooter /></div>
  );

  const handleBuy = () => {
    if (!user) { alert("You must be logged in to purchase."); navigate("/login"); return; }
    if (user.username === product.seller) { alert("You cannot buy your own listing."); return; }
    if (user.ltcBalance < product.price) { alert("ERROR: Insufficient LTC balance. Please deposit funds first.\nYour balance: " + user.ltcBalance.toFixed(4) + " LTC\nRequired: " + product.price + " LTC"); return; }
    if (!confirm(`Confirm purchase of "${product.title}" for ${product.price} LTC?\n\nFunds will be held in escrow until you confirm receipt.`)) return;
    const order = createOrder(product.id, user.username);
    if (order) {
      alert("✓ Order placed! " + product.price + " LTC held in escrow.\nOrder ID: " + order.id + "\n\nCheck your dashboard to manage this order.");
      navigate("/dashboard");
    } else {
      alert("ERROR: Could not complete purchase.");
    }
  };

  return (
    <div>
      <RetroHeader />
      <div className="retro-page">
        <p className="text-dim" style={{ fontSize: 10, marginBottom: 8 }}>
          <Link to="/" className="retro-link">Home</Link> » <Link to="/listings" className="retro-link">Listings</Link> » {product.title}
        </p>
        <div className="retro-card" style={{ padding: 16 }}>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: "top", width: 150, textAlign: "center", paddingRight: 16 }}>
                  <div style={{ width: 130, height: 130, background: "hsl(220,15%,15%)", border: "1px solid hsl(120,20%,25%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "hsl(120,20%,35%)" }}>
                    [NO IMAGE]
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span className="retro-badge">{product.category}</span>
                  </div>
                </td>
                <td style={{ verticalAlign: "top" }}>
                  <h1 style={{ fontSize: 16 }}>{product.title}</h1>
                  <table style={{ fontSize: 11, marginBottom: 10 }}>
                    <tbody>
                      <tr><td style={{ paddingRight: 16, color: "hsl(120,20%,45%)" }}>Vendor:</td><td><Link to={`/profile/${product.seller}`} className="retro-link">{product.seller}</Link></td></tr>
                      <tr><td style={{ color: "hsl(120,20%,45%)" }}>Price:</td><td className="text-ltc" style={{ fontWeight: "bold", fontSize: 14 }}>{product.price} LTC</td></tr>
                      <tr><td style={{ color: "hsl(120,20%,45%)" }}>Shipping:</td><td>{product.shipping}</td></tr>
                      <tr><td style={{ color: "hsl(120,20%,45%)" }}>Listed:</td><td>{product.createdAt}</td></tr>
                    </tbody>
                  </table>
                  <hr className="retro-separator" />
                  <h3>DESCRIPTION</h3>
                  <p style={{ fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{product.description}</p>
                  <hr className="retro-separator" />
                  <div style={{ marginTop: 8 }}>
                    {user && user.username !== product.seller && (
                      <button className="retro-btn retro-btn-accent" onClick={handleBuy} style={{ marginRight: 8 }}>
                        ★ BUY NOW (ESCROW) ★
                      </button>
                    )}
                    <Link to={`/messages?to=${product.seller}`}>
                      <button className="retro-btn">MESSAGE VENDOR</button>
                    </Link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <RetroFooter />
    </div>
  );
}
