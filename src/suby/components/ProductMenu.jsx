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
import { loadCart, saveCart, saveOrder, downloadReceipt, viewReceipt } from "../orderStore"; // NEW

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
  // NEW: menu search + veg / non-veg filter
  const [search, setSearch] = useState("");
  const [foodType, setFoodType] = useState("all");
  const [showCheckout, setShowCheckout] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [paying, setPaying] = useState(false);
  const [paidMsg, setPaidMsg] = useState("");
  // NEW: shown after a successful payment (order summary + PDF receipt link)
  const [receipt, setReceipt] = useState(null);

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

  // NEW: keep the cart across refreshes (per restaurant)
  useEffect(() => {
    setCart(loadCart(firmId));
  }, [firmId]);
  useEffect(() => {
    saveCart(firmId, cart);
  }, [firmId, cart]);

  const clearCart = () => setCart({});

  // NEW: filtered menu
  const visibleProducts = products.filter((p) => {
    const matchesSearch = !search.trim() || String(p.productName).toLowerCase().includes(search.trim().toLowerCase());
    const cats = Array.isArray(p.category) ? p.category : [];
    const matchesType = foodType === "all" || cats.includes(foodType);
    return matchesSearch && matchesType;
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
            // UPDATED: show a full success panel with the PDF receipt instead of a small toast
            const snapshot = {
              orderId: verifyData.orderId,
              paymentId: verifyData.paymentId || response.razorpay_payment_id,
              restaurant: firmName,
              items: cartItems.map((p) => ({ name: p.productName, qty: cart[p._id], price: parsePrice(p.price) })),
              total: totalPrice,
              paidVia: "",
            };
            setReceipt(snapshot);
            saveOrder(snapshot); // NEW: remember on this device for "My Orders"
            // best effort: fetch how it was paid (UPI/card/netbanking) for display
            fetch(`${API_URL}/payment/order/${snapshot.orderId}?pid=${snapshot.paymentId}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => {
                if (!d) return;
                const via = d.paymentDetail || d.paymentMethod || "";
                setReceipt((cur) => (cur ? { ...cur, paidVia: via } : cur));
                saveOrder({ ...snapshot, paidVia: via });
              })
              .catch(() => {});
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
        {/* NEW: search and veg / non-veg filter */}
        <div className="menuFilters">
          <input
            type="text"
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {["all", "veg", "non-veg"].map((t) => (
            <button
              key={t}
              type="button"
              className={foodType === t ? "filterBtn active" : "filterBtn"}
              onClick={() => setFoodType(t)}
            >
              {t === "all" ? "All" : t === "veg" ? "Veg" : "Non-veg"}
            </button>
          ))}
        </div>
        {products.length > 0 && visibleProducts.length === 0 && <p>No dishes match your search.</p>}
        {visibleProducts.map((item) => (
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

      {/* NEW: order confirmation with downloadable PDF receipt */}
      {receipt && (
        <div className="checkoutOverlay">
          <div className="checkoutForm receiptBox">
            <h3>✅ Payment successful</h3>
            <div className="receiptMeta">Order #{String(receipt.orderId).slice(-8).toUpperCase()} · {receipt.restaurant}</div>
            <div className="receiptItems">
              {receipt.items.map((it, i) => (
                <div key={i} className="receiptRow">
                  <span>{it.name} × {it.qty}</span>
                  <span>₹{(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="receiptRow receiptTotal"><span>Total paid</span><span>₹{Number(receipt.total).toFixed(2)}</span></div>
            </div>
            <div className="receiptMeta">Payment ID: {receipt.paymentId}</div>
            {receipt.paidVia && <div className="receiptMeta">Paid via: {receipt.paidVia}</div>}
            <div className="checkoutBtns">
              <button type="button" onClick={() => setReceipt(null)}>Close</button>
              <button type="button" onClick={() => viewReceipt(receipt.orderId, receipt.paymentId)}>View PDF</button>
              <button
                type="button"
                className="receiptDownload"
                onClick={() => downloadReceipt(receipt.orderId, receipt.paymentId)}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {totalQty > 0 && !showCheckout && (
        <div className="cartBar">
          <span>{totalQty} item(s) · ₹{totalPrice}</span>
          <button className="cartClear" onClick={clearCart}>Clear</button>
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
            <div className="checkoutNote">Pay with UPI, Netbanking or Indian cards. International cards are not supported.</div>
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

