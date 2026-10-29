import React, { useEffect, useState } from "react";
import { fetchOrderReviews, submitReview } from "../orderStore";

const Stars = ({ value, onChange, size = 24 }) => (
  <span className="stars" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <span
        key={n}
        role="radio"
        aria-checked={value === n}
        tabIndex={onChange ? 0 : -1}
        style={{ fontSize: size, cursor: onChange ? "pointer" : "default", color: n <= value ? "#f5a623" : "#ccc" }}
        onClick={() => onChange && onChange(n)}
        onKeyDown={(e) => onChange && (e.key === "Enter" || e.key === " ") && onChange(n)}
      >
        ★
      </span>
    ))}
  </span>
);

export { Stars };

// Rate each dish of a delivered order. Reviewed items show their saved stars instead of the form.
const ReviewItems = ({ orderId, paymentId, items }) => {
  const [done, setDone] = useState({}); // productId -> { rating, comment }
  const [draft, setDraft] = useState({}); // productId -> { rating, comment }
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchOrderReviews(orderId, paymentId).then((list) => {
      if (cancelled) return;
      const map = {};
      list.forEach((r) => (map[r.product] = { rating: r.rating, comment: r.comment }));
      setDone(map);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId, paymentId]);

  const send = async (productId) => {
    const d = draft[productId] || {};
    if (!d.rating) {
      setError("Pick a star rating first");
      return;
    }
    setBusy(productId);
    setError("");
    const r = await submitReview({ orderId, paymentId, productId, rating: d.rating, comment: (d.comment || "").trim() });
    setBusy("");
    if (r.ok) setDone((m) => ({ ...m, [productId]: { rating: d.rating, comment: d.comment || "" } }));
    else if (/already reviewed/i.test(r.error)) setDone((m) => ({ ...m, [productId]: { rating: d.rating, comment: d.comment || "" } }));
    else setError(r.error);
  };

  const reviewable = items.filter((it) => it.product);
  if (reviewable.length === 0) return null;

  return (
    <div className="reviewBox">
      <h4>Rate your order</h4>
      {reviewable.map((it) => {
        const pid = String(it.product);
        const saved = done[pid];
        const d = draft[pid] || {};
        return (
          <div className="reviewRow" key={pid}>
            <strong>{it.productName}</strong>
            {saved ? (
              <div>
                <Stars value={saved.rating} size={18} />
                {saved.comment && <div className="receiptMeta">“{saved.comment}”</div>}
              </div>
            ) : (
              <>
                <Stars value={d.rating || 0} onChange={(n) => setDraft((m) => ({ ...m, [pid]: { ...d, rating: n } }))} />
                <textarea
                  placeholder="Add a comment (optional)"
                  maxLength={500}
                  value={d.comment || ""}
                  onChange={(e) => setDraft((m) => ({ ...m, [pid]: { ...d, comment: e.target.value } }))}
                />
                <button type="button" disabled={busy === pid} onClick={() => send(pid)}>
                  {busy === pid ? "Saving..." : "Submit review"}
                </button>
              </>
            )}
          </div>
        );
      })}
      {error && <div className="receiptMeta" style={{ color: "#c0392b" }}>{error}</div>}
    </div>
  );
};

export default ReviewItems;
