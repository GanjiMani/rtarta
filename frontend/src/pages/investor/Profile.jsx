import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const nomineeRelations = ["Father", "Mother", "Spouse", "Son", "Daughter", "Other"];

export default function Profile() {
  const { fetchWithAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [personalEdit, setPersonalEdit] = useState(false);
  const [contactEdit, setContactEdit] = useState(false);
  const [bankEditIndex, setBankEditIndex] = useState(-1);
  const [nomineeEditIndex, setNomineeEditIndex] = useState(-1);

  const [error, setError] = useState("");
  const [docError, setDocError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [user, setUser] = useState({
    hasProfile: false,
    name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    pan: "",
    dob: "",
    kyc: "Pending",
    banks: [],
    nominees: [],
    kycDocuments: [],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Fetching investor profile...");
        const res = await fetchWithAuth(`/api/investor/profile`);
        console.log("Profile response status:", res.status, res.ok);
        
        if (!res.ok) {
          let errorMessage = "Unable to fetch profile";
          try {
            const errorData = await res.json();
            console.error("Profile fetch error response:", errorData);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (parseError) {
            const errorText = await res.text().catch(() => "Unknown error");
            console.error("Profile fetch failed, response text:", errorText);
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const response = await res.json();
        console.log("Profile response data:", response);
        
        // Extract investor data from response
        if (!response.data || !response.data.investor) {
          console.error("Invalid response structure:", response);
          throw new Error("Invalid response format from server");
        }
        
        const investorData = response.data.investor;
        console.log("Extracted investor data:", investorData);

        // Map bank accounts from backend format to frontend format
        const bankAccounts = (response.data?.bank_accounts || []).map(bank => ({
          bank_id: bank.id,
          account_no: bank.account_number || "",
          ifsc: bank.ifsc_code || "",
          branch: bank.branch_name || "",
          bank_name: bank.bank_name || "",
          verified: bank.is_primary || false
        }));

        // Map nominees from backend format to frontend format
        const nomineesList = (response.data?.nominees || []).map(nominee => ({
          nominee_id: nominee.id,
          name: nominee.full_name || "",
          relation: nominee.relationship || "",
          pct: nominee.allocation_percentage || 100,
          dob: nominee.date_of_birth || ""
        }));

        const userData = {
          hasProfile: true,
          name: investorData.full_name || "",
          pan: investorData.pan_number || "",
          dob: investorData.date_of_birth || "",
          email: investorData.email || "",
          phone: investorData.mobile_number || "",
          address_line1: investorData.address_line1 || "",
          address_line2: investorData.address_line2 || "",
          city: investorData.city || "",
          state: investorData.state || "",
          pincode: investorData.pincode || "",
          kyc: investorData.kyc_status || "Pending",
          banks: bankAccounts,
          nominees: nomineesList,
          kycDocuments: [],
        };
        
        console.log("Setting user data:", userData);
        setUser(userData);
        setError(""); // Clear any previous errors
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Failed to load profile: " + (err.message || "Unknown error"));
        // Set hasProfile to true so we can show the error message instead of loading forever
        setUser(prev => ({ ...prev, hasProfile: true }));
      }
    };
    fetchProfile();
  }, [fetchWithAuth]);

  const handleField = (e, section = null, index = null) => {
    const { name, value } = e.target;
    if (section === "banks") {
      const newBanks = [...user.banks];
      newBanks[index] = { ...newBanks[index], [name]: value };
      setUser((prev) => ({ ...prev, banks: newBanks }));
    } else if (section === "nominees") {
      const newNominees = [...user.nominees];
      newNominees[index] = { ...newNominees[index], [name]: value };
      setUser((prev) => ({ ...prev, nominees: newNominees }));
    } else {
      setUser((prev) => ({ ...prev, [name]: value }));
    }
  };

const savePersonal = async () => {
  try {
    const payload = {
      full_name: user.name,
    };
    const res = await fetchWithAuth(`/api/investor/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Failed to update profile" }));
      throw new Error(errorData.detail || "Failed to update profile");
    }
    // Reload profile after update
    const res2 = await fetchWithAuth(`/api/investor/profile`);
    if (res2.ok) {
      const response = await res2.json();
      const data = response.data?.investor || response.data || {};
      setUser(prev => ({
        ...prev,
        name: data.full_name || prev.name,
      }));
    }
    setPersonalEdit(false);
    setError("");
    setSuccessMsg("Personal information updated successfully!");
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMsg(""), 3000);
  } catch (err) {
    setError("Failed updating personal info: " + (err.message || "Unknown error"));
    setSuccessMsg("");
  }
};



const saveContact = async () => {
  try {
    const payload = {
      mobile_number: user.phone || null,
      address_line1: user.address_line1 || null,
      address_line2: user.address_line2 || null,
      city: user.city || null,
      state: user.state || null,
      pincode: user.pincode || null,
    };

    const res = await fetchWithAuth(`/api/investor/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Failed to update contact info" }));
      throw new Error(errorData.detail || "Failed to update contact info");
    }
    // Reload profile after update
    const res2 = await fetchWithAuth(`/api/investor/profile`);
    if (res2.ok) {
      const response = await res2.json();
      const data = response.data?.investor || response.data || {};
      setUser(prev => ({
        ...prev,
        phone: data.mobile_number || prev.phone,
        address_line1: data.address_line1 || prev.address_line1,
        address_line2: data.address_line2 || prev.address_line2,
        city: data.city || prev.city,
        state: data.state || prev.state,
        pincode: data.pincode || prev.pincode,
      }));
    }
    setContactEdit(false);
    setError("");
    setSuccessMsg("Contact information updated successfully!");
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMsg(""), 3000);
  } catch (err) {
    setError("Failed updating contact info: " + (err.message || "Unknown error"));
    setSuccessMsg("");
  }
};

  const saveBank = async (index) => {
    const bank = user.banks[index];
    const isNew = !bank.bank_id;
    const url = isNew
      ? `/api/investor/profile/bank-accounts`
      : `/api/investor/profile/bank-accounts/${bank.bank_id}`;
    const method = isNew ? "POST" : "PUT";
    try {
      // Map frontend fields to backend schema
      const payload = {
        account_number: bank.account_no,
        account_holder_name: user.name || "Account Holder", // Use investor name as default
        bank_name: bank.bank_name || "Bank", // Required field - use provided bank_name or default
        branch_name: bank.branch || "",
        ifsc_code: bank.ifsc,
      };
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to save bank account" }));
        throw new Error(errorData.detail || "Failed to save bank account");
      }
      const response = await res.json();
      const savedBankData = response.data?.bank_account || response.data || {};
      // Map backend response to frontend format
      const savedBank = {
        bank_id: savedBankData.id,
        account_no: savedBankData.account_number || bank.account_no,
        ifsc: savedBankData.ifsc_code || bank.ifsc,
        branch: savedBankData.branch_name || bank.branch,
        bank_name: savedBankData.bank_name || bank.bank_name || "",
        verified: savedBankData.is_primary || false
      };
      const newBanks = [...user.banks];
      newBanks[index] = savedBank;
      setUser((prev) => ({ ...prev, banks: newBanks }));
      setBankEditIndex(-1);
      setError("");
      setSuccessMsg(isNew ? "Bank account added successfully!" : "Bank account updated successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed saving bank info: " + (err.message || "Unknown error"));
      setSuccessMsg("");
    }
  };

  const saveNominee = async (index) => {
    const nominee = user.nominees[index];
    const isNew = !nominee.nominee_id;
    const url = isNew
      ? `/api/investor/profile/nominees`
      : `/api/investor/profile/nominees/${nominee.nominee_id}`;
    const method = isNew ? "POST" : "PUT";
    try {
      // Map frontend fields to backend schema
      const payload = {
        nominee_name: nominee.name,
        relationship: nominee.relation,
        allocation_percentage: parseFloat(nominee.pct) || 100,
        date_of_birth: nominee.dob || new Date().toISOString().split('T')[0], // Required field, use today as default if not provided
      };
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to save nominee" }));
        throw new Error(errorData.detail || "Failed to save nominee");
      }
      const response = await res.json();
      const savedNomineeData = response.data?.nominee || response.data || {};
      // Map backend response to frontend format
      const savedNominee = {
        nominee_id: savedNomineeData.id,
        name: savedNomineeData.nominee_name || nominee.name,
        relation: savedNomineeData.relationship || nominee.relation,
        pct: savedNomineeData.allocation_percentage || nominee.pct || 100,
        dob: savedNomineeData.date_of_birth || nominee.dob
      };
      const newNominees = [...user.nominees];
      newNominees[index] = savedNominee;
      setUser((prev) => ({ ...prev, nominees: newNominees }));
      setNomineeEditIndex(-1);
      setError("");
      setSuccessMsg(isNew ? "Nominee added successfully!" : "Nominee updated successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed saving nominee: " + (err.message || "Unknown error"));
      setSuccessMsg("");
    }
  };

  const deleteNominee = async (index) => {
    const nominee = user.nominees[index];
    if (!nominee.nominee_id) {
      // Remove locally if not saved yet
      setUser((prev) => ({
        ...prev,
        nominees: prev.nominees.filter((_, i) => i !== index),
      }));
      return;
    }
    try {
      const res = await fetchWithAuth(
        `/api/investor/profile/nominees/${nominee.nominee_id}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to delete nominee" }));
        throw new Error(errorData.detail || "Failed to delete nominee");
      }
      setUser((prev) => ({
        ...prev,
        nominees: prev.nominees.filter((_, i) => i !== index),
      }));
      if (nomineeEditIndex === index) setNomineeEditIndex(-1);
      setError("");
      setSuccessMsg("Nominee deleted successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed to delete nominee: " + (err.message || "Unknown error"));
      setSuccessMsg("");
    }
  };
  const deleteBank = async (index) => {
  const bank = user.banks[index];
  if (!bank.bank_id) {
    // Just remove locally if not saved yet
    setUser((prev) => ({
      ...prev,
      banks: prev.banks.filter((_, i) => i !== index),
    }));
    return;
  }
  try {
    const res = await fetchWithAuth(`/api/investor/profile/bank-accounts/${bank.bank_id}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      const errorData = await res.json().catch(() => ({ detail: "Failed to delete bank account" }));
      throw new Error(errorData.detail || "Failed to delete bank account");
    }
    setUser((prev) => ({
      ...prev,
      banks: prev.banks.filter((_, i) => i !== index),
    }));
    if (bankEditIndex === index) setBankEditIndex(-1);
    setError("");
    setSuccessMsg("Bank account deleted successfully!");
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMsg(""), 3000);
  } catch (error) {
    setError("Failed to delete bank account: " + (error.message || "Unknown error"));
    setSuccessMsg("");
  }
};


  const addBank = () => {
    setUser((prev) => ({
      ...prev,
      banks: [...prev.banks, { account_no: "", ifsc: "", branch: "", bank_name: "", verified: false }],
    }));
    setBankEditIndex(user.banks.length);
  };

  const addNominee = () => {
    setUser((prev) => ({
      ...prev,
      nominees: [...prev.nominees, { name: "", relation: "", pct: 100, dob: "" }],
    }));
    setNomineeEditIndex(user.nominees.length);
  };

const renderPersonalTab = () => {
  if (personalEdit) {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            name="name"
            value={user.name}
            onChange={handleField}
            placeholder="Enter your full name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
          <input
            name="pan"
            value={user.pan}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">PAN cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={user.dob}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Date of Birth cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
          <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              user.kyc === 'verified' ? 'bg-green-100 text-green-800' : 
              user.kyc === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {user.kyc.charAt(0).toUpperCase() + user.kyc.slice(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">KYC status is managed by the system</p>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={savePersonal} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={() => setPersonalEdit(false)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
          <p className="text-lg font-semibold text-gray-900">{user.name || "Not provided"}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-500 mb-1">PAN Number</label>
          <p className="text-lg font-semibold text-gray-900">{user.pan || "Not provided"}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
          <p className="text-lg font-semibold text-gray-900">
            {user.dob ? new Date(user.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "Not provided"}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-500 mb-1">KYC Status</label>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
            user.kyc === 'verified' ? 'bg-green-100 text-green-800' : 
            user.kyc === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {user.kyc ? user.kyc.charAt(0).toUpperCase() + user.kyc.slice(1) : "Pending"}
          </span>
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={() => setPersonalEdit(true)} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Edit Personal Information
        </button>
      </div>
    </div>
  );
};

  const renderContactTab = () =>
    contactEdit ? (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            name="email"
            value={user.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Please contact support for email updates.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
          <input
            name="phone"
            value={user.phone}
            onChange={handleField}
            placeholder="Enter mobile number"
            maxLength="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
          <input
            name="address_line1"
            value={user.address_line1}
            onChange={handleField}
            placeholder="Enter address line 1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2 (Optional)</label>
          <input
            name="address_line2"
            value={user.address_line2}
            onChange={handleField}
            placeholder="Enter address line 2 (optional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              name="city"
              value={user.city}
              onChange={handleField}
              placeholder="Enter city"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              name="state"
              value={user.state}
              onChange={handleField}
              placeholder="Enter state"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
            <input
              name="pincode"
              value={user.pincode}
              onChange={handleField}
              placeholder="Enter pincode"
              maxLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={saveContact} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={() => setContactEdit(false)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
            <p className="text-lg font-semibold text-gray-900">{user.email || "Not provided"}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-500 mb-1">Mobile Number</label>
            <p className="text-lg font-semibold text-gray-900">{user.phone || "Not provided"}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-500 mb-2">Address</label>
          <div className="text-gray-900">
            {user.address_line1 && <p className="text-lg">{user.address_line1}</p>}
            {user.address_line2 && <p className="text-lg">{user.address_line2}</p>}
            {(user.city || user.state || user.pincode) && (
              <p className="text-lg mt-1">
                {[user.city, user.state, user.pincode].filter(Boolean).join(", ")}
              </p>
            )}
            {!user.address_line1 && !user.address_line2 && !user.city && !user.state && !user.pincode && (
              <p className="text-gray-500">Not provided</p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={() => setContactEdit(true)} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Edit Contact Information
          </button>
        </div>
      </div>
    );

  const renderBankTab = () => (
    <div>
      {user.banks.map((bank, idx) =>
        bankEditIndex === idx ? (
          <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
            <input
              name="bank_name"
              value={bank.bank_name || ""}
              onChange={(e) => handleField(e, "banks", idx)}
              placeholder="Bank Name"
              className="input mb-2"
            />
            <input
              name="account_no"
              value={bank.account_no}
              onChange={(e) => handleField(e, "banks", idx)}
              placeholder="Account Number"
              className="input mb-2"
            />
            <input
              name="ifsc"
              value={bank.ifsc}
              onChange={(e) => handleField(e, "banks", idx)}
              placeholder="IFSC"
              className="input mb-2"
            />
            <input
              name="branch"
              value={bank.branch}
              onChange={(e) => handleField(e, "banks", idx)}
              placeholder="Branch"
              className="input mb-2"
            />
            <button onClick={() => saveBank(idx)} className="bg-blue-600 px-4 py-2 text-white rounded mr-2">
              Save
            </button>
            <button onClick={() => setBankEditIndex(-1)} className="bg-gray-300 px-4 py-2 rounded">
              Cancel
            </button>
            <button onClick={() => deleteBank(idx)} className="ml-2 bg-red-600 text-white px-3 py-1 rounded">
              Delete
            </button>
          </div>
        ) : (
          <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
            <p><strong>Bank:</strong> {bank.bank_name || "N/A"}</p>
            <p><strong>Account:</strong> {bank.account_no}</p>
            <p><strong>IFSC:</strong> {bank.ifsc}</p>
            <p><strong>Branch:</strong> {bank.branch}</p>
            <button onClick={() => setBankEditIndex(idx)} className="bg-yellow-500 px-4 py-2 rounded">
              Edit
            </button>
          </div>
        )
      )}
      <button onClick={addBank} className="bg-green-600 px-4 py-2 rounded text-white">
        Add Bank Account
      </button>
    </div>
  );

  const renderNomineeTab = () => (
    <div>
      {user.nominees.map((nominee, idx) =>
        nomineeEditIndex === idx ? (
          <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
            <input
              name="name"
              value={nominee.name}
              onChange={(e) => handleField(e, "nominees", idx)}
              placeholder="Nominee Name"
              className="input mb-2"
            />
            <select
              name="relation"
              value={nominee.relation}
              onChange={(e) => handleField(e, "nominees", idx)}
              className="input mb-2"
            >
              <option value="">-- Select Relation --</option>
              {nomineeRelations.map((rel) => (
                <option key={rel} value={rel}>{rel}</option>
              ))}
            </select>
            <input
              name="pct"
              value={nominee.pct || 100}
              type="number"
              min={1}
              max={100}
              onChange={(e) => handleField(e, "nominees", idx)}
              className="input mb-2"
              placeholder="Allocation (%)"
            />
            <input
              type="date"
              name="dob"
              value={nominee.dob || ""}
              onChange={(e) => handleField(e, "nominees", idx)}
              className="input mb-2"
              placeholder="Date of Birth"
            />
            <button onClick={() => saveNominee(idx)} className="bg-blue-600 px-4 py-2 rounded text-white mr-2">
              Save
            </button>
            <button
              onClick={() => setNomineeEditIndex(-1)}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteNominee(idx)}
              className="bg-red-600 px-4 py-2 rounded text-white ml-2"
            >
              Delete
            </button>
          </div>
        ) : (
          <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
            <p><strong>Name:</strong> {nominee.name}</p>
            <p><strong>Relation:</strong> {nominee.relation}</p>
            <p><strong>Allocation:</strong> {nominee.pct}%</p>
            <button onClick={() => setNomineeEditIndex(idx)} className="bg-yellow-500 px-4 py-2 rounded">
              Edit
            </button>
          </div>
        )
      )}
      <button onClick={addNominee} className="bg-green-600 px-4 py-2 rounded text-white">
        Add Nominee
      </button>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalTab();
      case "contact":
        return renderContactTab();
      case "bank":
        return renderBankTab();
      case "nominee":
        return renderNomineeTab();
      default:
        return null;
    }
  };

  if (!user.hasProfile)
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Investor Profile</h2>
          <p className="text-gray-600 mt-1">Manage your personal and contact information</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMsg}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex gap-1">
              {["personal", "contact", "bank", "nominee"].map((tab) => (
                <button
                  key={tab}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === tab
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveTab(tab);
                    setPersonalEdit(false);
                    setContactEdit(false);
                    setBankEditIndex(-1);
                    setNomineeEditIndex(-1);
                    setError("");
                    setDocError("");
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
