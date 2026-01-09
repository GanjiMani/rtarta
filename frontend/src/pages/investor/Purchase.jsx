import React, { useState } from "react";
import { useAuth } from "../../services/AuthContext";

export default function Purchase({ addTransaction }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    scheme: "",
    plan: "",
    amount: "",
    bank: "",
    paymentMode: "",
  });
  const dummySchemes = ["S001", "S002", "S003", "S004"];
  const schemeLabels = [
    "ABC Equity Fund",
    "XYZ Debt Fund",
    "Balanced Advantage",
    "Tax Saver ELSS",
  ];
  const dummyBanks = [
    "HDFC Bank - XXXX1234",
    "ICICI Bank - XXXX5678",
    "SBI Bank - XXXX9999",
  ];
  const dummyNav = 250;
  const minAmount = 1000;
  const [showReview, setShowReview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const calculatedUnits = form.amount ? (form.amount / dummyNav).toFixed(4) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !form.scheme ||
      !form.plan ||
      !form.amount ||
      !form.bank ||
      !form.paymentMode
    ) {
      alert("Please fill all fields");
      return;
    }
    if (form.amount < minAmount) {
      alert(`Minimum purchase amount is ₹${minAmount}`);
      return;
    }
    setShowReview(true);
  };

  const handleConfirm = async () => {
    setShowReview(false);
    setSuccessMsg("");
    const purchasePayload = {
      scheme_id: form.scheme,
      plan: form.plan,
      amount: parseFloat(form.amount),
      bank: form.bank,
      payment_mode: form.paymentMode,
    };
    try {
      const response = await fetch("http://localhost:8000/investor/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(purchasePayload),
      });
      if (!response.ok) throw new Error("Purchase failed");
      const txnResponse = await response.json();
      if (typeof addTransaction === "function") {
        addTransaction(txnResponse);
      }
      setSuccessMsg(
        "Purchase submitted successfully! Status: " + txnResponse.status
      );
    } catch (err) {
      setSuccessMsg("");
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Purchase</h2>
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMsg}
        </div>
      )}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Scheme</label>
            <select
              value={form.scheme}
              onChange={(e) => setForm({ ...form, scheme: e.target.value })}
              className="input"
            >
              <option value="">--Select Scheme--</option>
              {dummySchemes.map((id, idx) => (
                <option key={id} value={id}>
                  {schemeLabels[idx]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Plan</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="input"
            >
              <option value="">--Select Plan--</option>
              <option value="Growth">Growth</option>
              <option value="IDCW Payout">IDCW Payout</option>
              <option value="IDCW Reinvestment">IDCW Reinvestment</option>
            </select>
          </div>
          <div>
            <label>Amount (₹)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input"
            />
            {form.amount && (
              <div>
                NAV: ₹{dummyNav} | Units: {calculatedUnits}
              </div>
            )}
          </div>
          <div>
            <label>Bank</label>
            <select
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
              className="input"
            >
              <option value="">--Select Bank--</option>
              {dummyBanks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Payment Mode</label>
            <select
              value={form.paymentMode}
              onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
              className="input"
            >
              <option value="">--Select Payment Mode--</option>
              <option value="Net Banking">Net Banking</option>
              <option value="UPI">UPI</option>
              <option value="Debit Mandate">Debit Mandate</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Proceed
          </button>
        </form>
      </div>
      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Review Purchase</h3>
            <p>Scheme: {schemeLabels[dummySchemes.indexOf(form.scheme)]}</p>
            <p>Plan: {form.plan}</p>
            <p>Amount: ₹{form.amount}</p>
            <p>NAV: ₹{dummyNav}</p>
            <p>Units: {calculatedUnits}</p>
            <p>Bank: {form.bank}</p>
            <p>Payment Mode: {form.paymentMode}</p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowReview(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleConfirm} className="bg-blue-600 text-white px-4 py-2 rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
