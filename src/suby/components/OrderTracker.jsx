import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../api";

// NEW: shows live delivery status for one order, polling the backend every 15s.
// Stops polling once the order is delivered, or if the component unmounts.
const OrderTracker = ({ orderId, paymentId, onStatus }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false); // lets the scooter ride in from the start on first paint
  const timerRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/payment/track/${orderId}?pid=${encodeURIComponent(paymentId)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not load status");
      setData(d);
      if (onStatus) onStatus(d.deliveryStatus);
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

  // Once the first data has painted at the start position, let the scooter ride to the current step.
  useEffect(() => {
    if (!data || ready) return undefined;
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, [data, ready]);

  if (error) return <div className="trackerError">Could not load order status: {error}</div>;
  if (!data) return <div className="orderTracker"><div className="skeleton" style={{ height: 84 }} /></div>;

  const steps = data.steps;
  const idx = Math.max(0, steps.findIndex((s) => s.status === data.deliveryStatus));
  const final = idx === steps.length - 1;
  const progress = ready ? idx / (steps.length - 1) : 0;

  return (
    <div className={`orderTracker${final ? " complete" : ""}`} role="group" aria-label="Order progress">
      <div className="trackRail" style={{ "--n": steps.length, "--p": progress }}>
        <div className="trackLine"><div className={`trackFill${final ? " final" : ""}`} /></div>
        <div className={`trackRider${final ? " final" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 38 30" fill="none">
            <circle cx="8" cy="23" r="4.5" fill="#17163a" /><circle cx="30" cy="23" r="4.5" fill="#17163a" />
            <circle cx="8" cy="23" r="1.6" fill="#fff" /><circle cx="30" cy="23" r="1.6" fill="#fff" />
            <path d="M8 23h8l4-9h6l4 9" stroke="#17163a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="1" y="6" width="15" height="11" rx="2.5" fill="#ffa41b" /><path d="M1 10.5h15" stroke="#17163a" strokeWidth="1.4" />
            <path d="M24 14l-1.5-5h5" stroke="#17163a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <ol className="trackerSteps">
          {steps.map((s, i) => (
            <li key={s.status} className={`trackerStep ${i < idx ? "done" : ""} ${i === idx ? "current" : ""} ${final && i === idx ? "final" : ""}`}
                aria-current={i === idx ? "step" : undefined}>
              <span className="trackerDot">
                <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.4l2.3 2.3L9.5 3.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span className="trackerLabel">{s.label}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="trackerNow" key={data.deliveryStatus}>{data.statusLabel}</p>
    </div>
  );
};

export default OrderTracker;
