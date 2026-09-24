// import React, { useState, useEffect } from "react";
// import { API_URL } from "../api";
// import { useParams } from "react-router-dom";
// import TopBar from "./TopBar";

// const ProductMenu = () => {
//   const [products, setProducts] = useState([]);

//   const { firmId, firmName } = useParams();
    

//   const productHandler = async () => {
//     try {
//       const response = await fetch(`${API_URL}/product/${firmId}/products`);
//       const newProductData = await response.json();
//       setProducts(newProductData.products);
//     } catch (error) {
//       console.error("product failed to fetch", error);
//     }
//   };

//   useEffect(() => {
//     productHandler();
//   }, []);

//   return (
//     <>
//       <TopBar />
//       <section className="productSection">
//         <h3>{firmName}</h3>
//         {products.map((item) => {
//           return (
//             <div className="productBox">
//               <div>
//                 <div><strong>{item.productName}</strong></div>
//                 <div>₹{item.price}</div>
//                 <div>{item.description}</div>
//               </div>
//               <div className="productGroup">
//                 {/* <img src={`${API_URL}/uploads/${item.image}`} /> */}
//                 <img src={item.image} alt={item.productName} />
//                 <div className="addButton">ADD</div>
//               </div>
//             </div>
//           );
//         })}
//       </section>
//     </>
//   );
// };

// export default ProductMenu;



import React, { useState, useEffect } from "react";
import { API_URL } from "../api";
import { useParams } from "react-router-dom";
import TopBar from "./TopBar";

// NEW: loads Razorpay Checkout script once
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// NEW: price is stored as a String in DB and can look like "₹80", "80/-" or "1,200".
// Strip non-numeric chars before doing math so totals never become NaN.
const parsePrice = (raw) => {
  const n = parseFloat(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const ProductMenu = () => {
  const [products, setProducts] = useState([]);

  // NEW: cart = { [productId]: qty }, checkout form + status
  const [cart, setCart] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [paying, setPaying] = useState(false);
  const [paidMsg, setPaidMsg] = useState("");

  const { firmId, firmName } = useParams();

  const productHandler = async () => {
    try {
      const response = await fetch(`${API_URL}/product/${firmId}/products`);
      const newProductData = await response.json();
      setProducts(newProductData.products);
    } catch (error) {
      console.error("product failed to fetch", error);
    }
  };

  useEffect(() => {
    productHandler();
  }, []);

  // NEW: cart helpers
  const addToCart = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id) =>
    setCart((c) => {
      const next = { ...c };
      if (next[id] > 1) next[id] -= 1;
      else delete next[id];
      return next;
    });

  const cartItems = products.filter((p) => cart[p._id]);
  const totalQty = cartItems.reduce((n, p) => n + cart[p._id], 0);
  const totalPrice = cartItems.reduce((n, p) => n + parsePrice(p.price) * cart[p._id], 0);

  // NEW: Razorpay payment flow (create order -> open checkout -> verify on backend)
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.phone || !customer.address) {
      alert("Please fill name, phone and address");
      return;
    }
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Could not load Razorpay. Check your internet.");

      const res = await fetch(`${API_URL}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmId,
          items: cartItems.map((p) => ({ productId: p._id, qty: cart[p._id] })),
          customer,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not create order");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "YUMMY",
        description: `Order from ${firmName}`,
        prefill: { name: customer.name, contact: customer.phone },
        theme: { color: "#e15b64" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_URL}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
            setPaidMsg(`Payment successful! Order id: ${verifyData.orderId}`);
            setCart({});
            setShowCheckout(false);
          } catch (err) {
            alert(err.message);
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on("payment.failed", (r) => {
        alert("Payment failed: " + (r.error?.description || "Try again"));
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err.message);
      setPaying(false);
    }
  };

  return (
    <>
      <TopBar />
      <section className="productSection">
        <h3>{firmName}</h3>
        {products.map((item) => (
          <div className="productBox" key={item._id}> {/* ✅ key added */}
            <div>
              <div><strong>{item.productName}</strong></div>
              <div>₹{item.price}</div>
              <div>{item.description}</div>
            </div>
            <div className="productGroup">
              <img src={item.image} alt={item.productName} /> {/* ✅ Cloudinary URL */}
              {/* UPDATED: ADD button now adds to cart, shows -/qty/+ once added */}
              {cart[item._id] ? (
                <div className="addButton qtyControl">
                  <span onClick={() => removeFromCart(item._id)}>−</span>
                  <span>{cart[item._id]}</span>
                  <span onClick={() => addToCart(item._id)}>+</span>
                </div>
              ) : (
                <div className="addButton" onClick={() => addToCart(item._id)}>ADD</div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* NEW: success message, cart bar and checkout form */}
      {paidMsg && <div className="paidMsg">{paidMsg}</div>}

      {totalQty > 0 && !showCheckout && (
        <div className="cartBar">
          <span>{totalQty} item(s) · ₹{totalPrice}</span>
          <button onClick={() => { setPaidMsg(""); setShowCheckout(true); }}>Checkout</button>
        </div>
      )}

      {showCheckout && (
        <div className="checkoutOverlay">
          <form className="checkoutForm" onSubmit={handlePayment}>
            <h3>Delivery details</h3>
            <input placeholder="Name" value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            <input placeholder="Phone" value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            <textarea placeholder="Address" value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
            <div className="checkoutTotal">Total: ₹{totalPrice}</div>
            <div className="checkoutBtns">
              <button type="button" onClick={() => setShowCheckout(false)} disabled={paying}>Back</button>
              <button type="submit" disabled={paying}>{paying ? "Please wait..." : `Pay ₹${totalPrice}`}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ProductMenu;

