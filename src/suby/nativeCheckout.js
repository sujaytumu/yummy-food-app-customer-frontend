import { Capacitor, registerPlugin } from "@capacitor/core";
import { API_URL } from "./api";

// NEW: inside the Android app we use Razorpay's native checkout (see RazorpayCheckoutPlugin.java).
const YummyCheckout = registerPlugin("YummyCheckout");

export const isNativeApp = () => Capacitor.isNativePlatform();

// Opens the native payment screen. Always resolves:
//   { ok: true, response: { razorpay_payment_id, razorpay_order_id, razorpay_signature } }
//   { ok: false, cancelled: true }                   (user closed the screen)
//   { ok: false, error: { code, description, reason, step, source } }
export const openNativeCheckout = async (options) => {
  try {
    const result = await YummyCheckout.open(options);
    let response = result?.response;
    if (typeof response === "string") response = JSON.parse(response);
    if (!response?.razorpay_payment_id) {
      return { ok: false, error: { description: "Payment finished but no payment id was returned" } };
    }
    return { ok: true, response };
  } catch (err) {
    let error = {};
    try {
      error = JSON.parse(err?.message);
    } catch {
      error = { description: err?.message || "Payment failed" };
    }
    // Razorpay SDK uses code 0 when the user closes the payment screen
    if (Number(error.code) === 0 || /cancel/i.test(error.description || "")) return { ok: false, cancelled: true };
    return { ok: false, error };
  }
};

// Tells the server why a payment failed (shows up in the backend logs). Never throws.
export const reportPaymentFailure = (orderId, error) => {
  try {
    fetch(`${API_URL}/payment/report-failure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razorpay_order_id: orderId, error }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
};
