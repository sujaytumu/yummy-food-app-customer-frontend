import React, { useEffect, useState } from "react";
import { fetchTracking } from "../orderStore";

const DEFAULT_STEPS = [
  { status: "placed", label: "Order placed" },
  { status: "preparing", label: "Preparing your food" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];
const POLL_MS = 10000;

// NEW: placed -> preparing -> out for delivery -> delivered. Polls until delivered.
const OrderTracker = ({ orderId, paymentId, onStatus }) => {
  const [track, setTrack] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer;
    const load = async () => {
      const r = await fetchTracking(orderId, paymentId);
      if (cancelled) return;
      if (r.ok) {
        setTrack(r);
        if (onStatus) onStatus(r.deliveryStatus);
        setError("");
        if (r.deliveryStatus !== "delivered" && !document.hidden) timer = setTimeout(load, POLL_MS);
        else if (r.deliveryStatus !== "delivered") timer = setTimeout(load, POLL_MS * 3);
      } else {
        setError(r.error);
        timer = setTimeout(load, POLL_MS * 3);
      }
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, paymentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!track) return <div className="receiptMeta">{error || "Loading status..."}</div>;

  const steps = track.steps || DEFAULT_STEPS;
  const idx = steps.findIndex((s) => s.status === track.deliveryStatus);

  return (
    <div className="orderTracker">
      <div className="trackerCurrent">{track.statusLabel}</div>
      <ol className="trackerSteps">
        {steps.map((s, i) => (
          <li key={s.status} className={i < idx ? "done" : i === idx ? "current" : ""}>
            <span className="trackerDot">{i <= idx ? "✓" : ""}</span>
            <span className="trackerLabel">{s.label}</span>
          </li>
        ))}
      </ol>
      {error && <div className="receiptMeta">Reconnecting...</div>}
    </div>
  );
};

export default OrderTracker;
