import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft, Search, Calendar, Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

export default function RegulatoryDisclosure() {
  const { fetchWithAuth } = useAuth();
  const [disclosures, setDisclosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { if (fetchWithAuth) fetchDisclosures(); }, [fetchWithAuth]);

  const fetchDisclosures = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/disclosures`);
      if (res.ok) setDisclosures((await res.json()).data || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const filtered = disclosures.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Regulatory Disclosures</h1>
            <p className="text-gray-500 text-sm">Compliance notices & updates.</p>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input type="text" placeholder="Search notices..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {loading ? <div className="p-8 text-center text-gray-500">Loading disclosures...</div> : (
        <div className="space-y-4">
          {filtered.map(d => (
            <div key={d.id} className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors flex gap-4 items-start" onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
                <div className={`p-2 rounded bg-blue-50 text-blue-600`}><FileText size={20} /></div>
                <div className="flex-grow">
                  <h3 className="text-sm font-bold text-gray-900">{d.title}</h3>
                  <div className="flex gap-2 text-xs text-gray-400 mt-1">
                    <span className="uppercase font-medium text-gray-500">{d.category?.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(d.published_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="text-gray-400">{expandedId === d.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
              </div>
              {expandedId === d.id && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap">
                  {d.content}
                  <div className="mt-4 flex gap-3">
                    <button className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:text-blue-600 hover:border-blue-200 flex items-center gap-1"><Download size={14} /> Download PDF</button>
                    <button className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:text-blue-600 hover:border-blue-200 flex items-center gap-1"><ExternalLink size={14} /> View Online</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!filtered.length && <div className="p-12 text-center text-gray-400 border border-gray-100 border-dashed rounded-lg">No disclosures found.</div>}
        </div>
      )}
    </div>
  );
}
