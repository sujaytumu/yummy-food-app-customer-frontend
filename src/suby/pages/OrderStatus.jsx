import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import OrderTracker from "../components/OrderTracker";
import { API_URL } from "../api";

// NEW: dedicated live order page (/order/:orderId?pid=...). The tracker inside auto-refreshes.
const OrderStatus = () => {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const pid = params.get("pid") || "";
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pid) {
      setError("This tracking link is missing its payment id. Open the order from My Orders.");
      return;
    }
    let cancelled = false;
    fetch(`${API_URL}/payment/order/${orderId}?pid=${encodeURIComponent(pid)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `Could not load order (${r.status})`);
        if (!cancelled) setOrder(d);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [orderId, pid]);

  return (
    <>
      <TopBar />
      <section className="productSection">
        <h3>Track order #{String(orderId).slice(-8).toUpperCase()}</h3>
        {error && <p>{error}</p>}
        {!error && !order && <p>Loading...</p>}
        {order && (
          <div className="myOrderCard">
            <div className="receiptMeta">
              {order.restaurant} · {new Date(order.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </div>
            <OrderTracker orderId={orderId} paymentId={pid} />
            <div className="receiptItems">
              {order.items.map((it, i) => (
                <div key={i} className="receiptRow">
                  <span>{it.productName} × {it.qty}</span>
                  <span>₹{(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="receiptRow receiptTotal"><span>Total paid</span><span>₹{Number(order.amount).toFixed(2)}</span></div>
            </div>
            {order.statusHistory?.length > 0 && (
              <div className="receiptMeta">
                {order.statusHistory.map((h, i) => (
                  <div key={i}>
                    {h.status.replace(/_/g, " ")} · {new Date(h.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Link to="/my-orders">← My Orders</Link>
      </section>
    </>
  );
};

export default OrderStatus;
