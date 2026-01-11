import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  Calendar,
  Hash,
  Download,
  BookOpen,
  Scale,
  Search
} from "lucide-react";

export default function RegulatoryDisclosure() {
  const { fetchWithAuth } = useAuth();
  const [disclosures, setDisclosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchDisclosures();
    }
  }, [fetchWithAuth]);

  const fetchDisclosures = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/disclosures`);
      if (!res.ok) throw new Error("Failed to fetch disclosures");
      const data = await res.json();
      setDisclosures(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDisclosures = disclosures.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryTheme = (category) => {
    switch (category?.toLowerCase()) {
      case "compliance": return "bg-slate-100 text-slate-700 border-slate-200";
      case "risk_notice": return "bg-amber-100 text-amber-700 border-amber-200";
      case "market_update": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Official Header */}
      <div className="bg-[#1E293B] text-white overflow-hidden relative border-b-8 border-amber-500">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/topography.png')]"></div>
        <div className="max-w-7xl mx-auto px-10 py-24 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-10">
              <div className="p-6 bg-amber-500 rounded-[2.5rem] shadow-[0_0_50px_rgba(245,158,11,0.3)]">
                <Scale className="w-16 h-16 text-[#1E293B]" />
              </div>
              <div>
                <h1 className="text-6xl font-black tracking-tighter mb-3">Regulatory Portal</h1>
                <p className="text-slate-400 text-2xl font-medium max-w-xl italic">Official compliance notices, statutory disclosures, and transparency reports.</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex items-center gap-6">
                <ShieldCheck className="w-12 h-12 text-amber-400" />
                <div>
                  <p className="text-white font-black text-xl">Compliance Score: 100%</p>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Last Audit: Dec 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2 flex-grow">
            <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-[#1E293B] mb-2">Notice Repository</h2>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-1.5 bg-amber-500 rounded-full"></span>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Statutory Transparency Log</p>
                </div>
              </div>
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Query archival records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:ring-8 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-bold text-slate-700 shadow-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-10">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[3rem] border border-slate-100"></div>
                ))}
              </div>
            ) : filteredDisclosures.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200 shadow-inner group">
                <div className="p-10 bg-slate-50 rounded-[3rem] w-32 h-32 flex items-center justify-center mx-auto mb-8 border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                  <BookOpen className="w-16 h-16 text-slate-200" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">No Records Found</h3>
                <p className="text-slate-400 font-medium">Your search query did not match any active disclosures.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {filteredDisclosures.map((d) => (
                  <div
                    key={d.id}
                    className={`bg-white rounded-[3rem] border transition-all duration-500 ${expandedId === d.id
                        ? "shadow-[0_20px_40px_rgba(30,41,59,0.08)] border-amber-200"
                        : "shadow-sm border-slate-100 hover:shadow-xl hover:-translate-y-1"
                      }`}
                  >
                    <div
                      className="p-10 cursor-pointer flex items-start gap-8"
                      onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    >
                      <div className={`p-4 rounded-2xl ${d.is_mandatory ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"}`}>
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-4 mb-3">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getCategoryTheme(d.category)}`}>
                            {d.category.replace('_', ' ')}
                          </span>
                          {d.is_mandatory && (
                            <span className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                              <AlertTriangle className="w-3.5 h-3.5" /> High Priority
                            </span>
                          )}
                        </div>
                        <h3 className="text-3xl font-black text-[#1E293B] mb-1 group-hover:text-amber-600 transition-colors leading-tight">
                          {d.title}
                        </h3>
                        <div className="flex items-center gap-6 mt-4">
                          <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> {new Date(d.published_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          {d.reference_number && (
                            <p className="text-slate-400 font-black text-xs flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                              <Hash className="w-4 h-4" /> {d.reference_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`p-3 rounded-full bg-slate-50 border border-slate-100 transition-transform duration-500 ${expandedId === d.id ? "rotate-180 bg-amber-50 text-amber-600 border-amber-200" : "text-slate-300"}`}>
                        <ChevronDown className="w-8 h-8" />
                      </div>
                    </div>

                    {expandedId === d.id && (
                      <div className="px-10 pb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="pt-8 border-t border-slate-100">
                          <div className="bg-slate-50/50 p-12 rounded-[2.5rem] border border-slate-100 shadow-inner">
                            <p className="text-[#1E293B] text-xl leading-[2.2] font-semibold whitespace-pre-wrap">
                              {d.content}
                            </p>

                            <div className="mt-12 flex flex-wrap gap-4">
                              <button className="flex items-center gap-3 bg-[#1E293B] text-white px-8 py-4 rounded-2xl font-black transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95 shadow-lg shadow-slate-900/20">
                                <Download className="w-5 h-5" />
                                DOWNLOAD OFFICIAL PDF
                              </button>
                              <button className="flex items-center gap-3 bg-white text-slate-600 border-2 border-slate-100 px-8 py-4 rounded-2xl font-black transition-all hover:border-amber-200 hover:text-amber-600 active:scale-95 shadow-sm">
                                <ExternalLink className="w-5 h-5" />
                                VIEW ON REGULATOR SITE
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-96 space-y-12">
            <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl shadow-slate-900/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="w-32 h-32 text-amber-600" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Info className="w-8 h-8 text-amber-500" />
                Member Guidance
              </h4>
              <ul className="space-y-6">
                {[
                  "Mandatory notices require investor acknowledgement",
                  "Historical archives are kept for 7 academic years",
                  "Regulatory updates are pushed via RTARTA secure channel",
                  "Contact compliance officer for clarity on any notice"
                ].map((text, i) => (
                  <li key={i} className="flex gap-5 text-slate-500 font-bold text-sm leading-relaxed italic">
                    <span className="text-amber-500 mt-1 flex-shrink-0">✦</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group`}>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <h4 className="text-3xl font-black mb-6 leading-tight font-serif">Quarterly Transparency Report</h4>
                <p className="text-amber-100 font-medium mb-10 leading-relaxed text-lg">Download the consolidated audit and transparency report for Q4 2025.</p>
                <button className="w-full py-5 bg-white text-[#1E293B] rounded-2xl font-black transition-all hover:bg-amber-50 shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
                  <Download className="w-6 h-6" />
                  GET ARCHIVE (14.2 MB)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
