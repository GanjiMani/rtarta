import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { Users, Search, Mail, Phone, MapPin, Star, ArrowLeft, ShieldCheck } from "lucide-react";

export default function MyAgents() {
  const { fetchWithAuth } = useAuth();
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (fetchWithAuth) fetchAgents(); }, [fetchWithAuth]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/agents`);
      if (res.ok) setAgents((await res.json()).data || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const filtered = agents.filter(a =>
    (a.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (a.arn_number || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Agents</h1>
            <p className="text-gray-500 text-sm">Manage advisor relationships.</p>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input type="text" placeholder="Search agents by name or ARN..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? <div className="p-8 text-center text-gray-500">Loading agents...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <div key={a.id} className="border border-gray-100 rounded-lg shadow-sm bg-white p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">{a.name.charAt(0)}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{a.name}</h3>
                    <div className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheck size={12} /> {a.arn_number}</div>
                  </div>
                </div>
                {a.rating && <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-600 text-xs font-bold"><Star size={12} fill="currentColor" /> {a.rating}</div>}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4 flex-grow">
                <div className="flex items-center gap-2 text-xs"><Mail size={14} className="text-gray-400" /> {a.email}</div>
                <div className="flex items-center gap-2 text-xs"><Phone size={14} className="text-gray-400" /> {a.phone}</div>
                <div className="flex items-center gap-2 text-xs"><MapPin size={14} className="text-gray-400" /> {a.city || 'N/A'}</div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex gap-2">
                <button className="flex-1 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Contact</button>
                <button className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-50">View Profile</button>
              </div>
            </div>
          ))}
          {!filtered.length && <div className="col-span-full p-12 text-center text-gray-400 border border-gray-100 border-dashed rounded-lg">No agents found.</div>}
        </div>
      )}
    </div>
  );
}
