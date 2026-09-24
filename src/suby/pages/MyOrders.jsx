import React, { useState } from "react";
import TopBar from "../components/TopBar";
import { loadOrders, downloadReceipt, viewReceipt, emailReceipt } from "../orderStore";

// NEW: orders paid from this browser, with receipt download
const MyOrders = () => {
  const [orders] = useState(loadOrders);

  return (
    <>
      <TopBar />
      <section className="productSection">
        <h3>My Orders</h3>
        {orders.length === 0 && <p>No orders yet on this device.</p>}
        {orders.map((o) => (
          <div className="myOrderCard" key={o.orderId}>
            <div className="receiptMeta">
              Order #{String(o.orderId).slice(-8).toUpperCase()} · {o.restaurant} ·{" "}
              {new Date(o.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </div>
            <div className="receiptItems">
              {o.items.map((it, i) => (
                <div key={i} className="receiptRow">
                  <span>{it.name} × {it.qty}</span>
                  <span>₹{(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="receiptRow receiptTotal"><span>Total paid</span><span>₹{Number(o.total).toFixed(2)}</span></div>
            </div>
            {o.paidVia && <div className="receiptMeta">Paid via: {o.paidVia}</div>}
            <div className="checkoutBtns">
              <button type="button" onClick={() => viewReceipt(o.orderId, o.paymentId)}>View PDF</button>
              <button
                type="button"
                onClick={async () => {
                  const to = window.prompt("Send receipt PDF to which email?", o.email || "");
                  if (!to) return;
                  const r = await emailReceipt(o.orderId, o.paymentId, to.trim());
                  alert(r.ok ? `Receipt emailed to ${r.to}` : `Could not email: ${r.error}`);
                }}
              >
                Email PDF
              </button>
              <button type="button" className="receiptDownload" onClick={() => downloadReceipt(o.orderId, o.paymentId)}>Download PDF</button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
};

export default MyOrders;
