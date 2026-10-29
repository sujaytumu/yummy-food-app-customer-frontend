import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../api";

// NEW: shows live delivery status for one order, polling the backend every 15s.
// Stops polling once the order is delivered, or if the component unmounts.
const OrderTracker = ({ orderId, paymentId }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/payment/track/${orderId}?pid=${encodeURIComponent(paymentId)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not load status");
      setData(d);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => {
      // UPDATED: stop polling once delivered, no point hitting the server forever
      setData((cur) => {
        if (cur?.deliveryStatus === "delivered") {
          clearInterval(timerRef.current);
          return cur;
        }
        load();
        return cur;
      });
    }, 15000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paymentId]);

  if (error) return <div className="trackerError">Could not load order status: {error}</div>;
  if (!data) return <div className="receiptMeta">Loading status...</div>;

  const idx = data.steps.findIndex((s) => s.status === data.deliveryStatus);

  return (
    <div className="orderTracker">
      <div className="trackerSteps">
        {data.steps.map((s, i) => (
          <div key={s.status} className={`trackerStep ${i <= idx ? "done" : ""} ${i === idx ? "current" : ""}`}>
            <div className="trackerDot" />
            <div className="trackerLabel">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTracker;
