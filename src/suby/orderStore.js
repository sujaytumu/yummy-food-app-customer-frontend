import { API_URL } from "./api";

// NEW: small helpers (all localStorage access is wrapped - it can throw in private mode)
const safeGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

// ---- cart (kept per restaurant so a refresh doesn't lose it)
export const loadCart = (firmId) => safeGet(`yummyCart:${firmId}`, {});
export const saveCart = (firmId, cart) => safeSet(`yummyCart:${firmId}`, cart);

// ---- paid orders placed from this device (for "My Orders")
export const loadOrders = () => safeGet("yummyOrders", []);
export const saveOrder = (order) => {
  const list = loadOrders().filter((o) => o.orderId !== order.orderId);
  list.unshift({ ...order, paidAt: order.paidAt || new Date().toISOString() });
  safeSet("yummyOrders", list.slice(0, 30));
};

// ---- receipt PDF
const receiptUrl = (orderId, paymentId, inline) =>
  `${API_URL}/payment/receipt/${orderId}?pid=${encodeURIComponent(paymentId)}${inline ? "&inline=1" : ""}`;

// Fetches the PDF as a file and saves it; shows the real reason if something goes wrong
export const downloadReceipt = async (orderId, paymentId) => {
  try {
    const res = await fetch(receiptUrl(orderId, paymentId, false));
    if (!res.ok) {
      let msg = `Could not get receipt (status ${res.status})`;
      try {
        const j = await res.json();
        if (j?.error) msg = j.error;
      } catch { /* not json */ }
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (!blob.size) throw new Error("Receipt file is empty, please try again");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Yummy-Receipt-${String(orderId).slice(-8).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error(err);
    alert(err.message || "Receipt download failed");
  }
};

// NEW: email the receipt PDF (backend sends it through Resend)
export const emailReceipt = async (orderId, paymentId, email) => {
  try {
    const res = await fetch(`${API_URL}/payment/send-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, pid: paymentId, email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Could not send email (status ${res.status})`);
    return { ok: true, to: data.emailTo || email };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

// Opens the PDF in a new tab (viewer)
export const viewReceipt = (orderId, paymentId) => {
  window.open(receiptUrl(orderId, paymentId, true), "_blank", "noopener");
};
