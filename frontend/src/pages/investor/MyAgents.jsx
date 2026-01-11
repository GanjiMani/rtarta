import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  TrendingUp,
  Briefcase,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  UserCheck
} from "lucide-react";

export default function MyAgents() {
  const { fetchWithAuth } = useAuth();
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fetchWithAuth) {
      fetchAgents();
    }
  }, [fetchWithAuth]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/agents`);
      if (!res.ok) throw new Error("Failed to fetch registered agents");
      const data = await res.json();
      setAgents(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) =>
    (agent.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.firm_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.arn_number || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA]">
      {/* Premium Institutional Header */}
      <div className="bg-[#064E3B] text-white relative overflow-hidden border-b-8 border-emerald-500/20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-7xl mx-auto px-10 py-28 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="flex items-center gap-12">
              <div className="p-8 bg-emerald-500 rounded-[3rem] shadow-[0_0_80px_rgba(16,185,129,0.35)] rotate-3">
                <Users className="w-20 h-20 text-white" />
              </div>
              <div>
                <h1 className="text-7xl font-black tracking-tight mb-4 leading-tight">Advisor Network</h1>
                <p className="text-emerald-100/70 text-2xl font-medium max-w-2xl italic">Manage your professional relationships with registered distributors and wealth managers.</p>
              </div>
            </div>
            <div className="hidden xl:block">
              <div className="flex gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 text-center min-w-[200px]">
                  <p className="text-5xl font-black text-emerald-400 mb-2">{agents.length}</p>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/50">ACTIVE AGENTS</p>
                </div>
                <div className="bg-emerald-500 shadow-2xl rounded-[2.5rem] p-10 text-center min-w-[200px]">
                  <p className="text-5xl font-black text-white mb-2">5.0</p>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900/50">AVG RATING</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 -mt-16 relative z-10 pb-32">
        {/* Search Bar */}
        <div className="mb-16">
          <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl shadow-emerald-900/5 flex flex-col md:flex-row items-center gap-8 border border-emerald-50/50">
            <div className="relative flex-grow group w-full">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-300 w-8 h-8 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by ARN, Firm Name or Agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-20 pr-10 py-7 bg-emerald-50/30 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-[2.5rem] text-xl font-bold text-emerald-900 transition-all outline-none placeholder:text-emerald-200"
              />
            </div>
            <button className="bg-[#064E3B] text-white px-12 py-7 rounded-[2.5rem] font-black hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center gap-4 text-lg">
              <Award className="w-7 h-7" />
              VERIFY NEW ARN
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[500px] bg-white rounded-[4rem] animate-pulse border border-emerald-50"></div>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white py-40 rounded-[5rem] border-4 border-dashed border-emerald-100 text-center px-10">
            <div className="w-40 h-40 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-10">
              <Users className="w-20 h-20 text-emerald-200" />
            </div>
            <h3 className="text-4xl font-black text-emerald-900 mb-4">No Advisors Linked</h3>
            <p className="text-emerald-400 text-xl font-medium max-w-lg mx-auto leading-relaxed">We couldn't find any wealth managers or distributors linked to your account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="group bg-white rounded-[4rem] border-2 border-emerald-50/50 hover:border-emerald-500/30 transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_40px_80px_rgba(6,78,59,0.08)] overflow-hidden flex flex-col h-full"
              >
                {/* Header Section */}
                <div className="p-10 pb-6 relative">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50/50 rounded-bl-[10rem] -z-0 transition-all group-hover:bg-emerald-500 group-hover:scale-150 duration-700 opacity-20 group-hover:opacity-5"></div>

                  <div className="flex justify-between items-start relative z-10 mb-8">
                    <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center group-hover:bg-emerald-500 group-hover:scale-110 transition-all duration-500">
                      <Briefcase className="w-10 h-10 text-emerald-700 group-hover:text-white" />
                    </div>
                    <div className="bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">ID: {agent.distributor_id}</span>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-emerald-900 mb-2 group-hover:text-emerald-500 transition-colors">{agent.name}</h3>
                    <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> {agent.firm_name || "Independent Advisor"}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="px-10 py-8 bg-emerald-50/30 border-y border-emerald-50 flex justify-between">
                  <div className="text-center">
                    <p className="text-xs font-black text-emerald-300 uppercase tracking-tighter mb-1">Experience</p>
                    <p className="text-xl font-black text-emerald-900">{agent.experience_years}Y+</p>
                  </div>
                  <div className="w-px h-10 bg-emerald-100"></div>
                  <div className="text-center">
                    <p className="text-xs font-black text-emerald-300 uppercase tracking-tighter mb-1">Rating</p>
                    <div className="flex items-center gap-1.5 justify-center">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <p className="text-xl font-black text-emerald-900">{agent.rating}</p>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-emerald-100"></div>
                  <div className="text-center">
                    <p className="text-xs font-black text-emerald-300 uppercase tracking-tighter mb-1">Status</p>
                    <p className={`text-sm font-black uppercase tracking-widest ${agent.is_active ? "text-emerald-500" : "text-rose-500"}`}>
                      {agent.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="p-10 space-y-8 flex-grow">
                  <div className="flex items-center gap-6 group/item cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center group-hover/item:bg-emerald-50 transition-colors shadow-sm">
                      <Mail className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-1">Official Email</p>
                      <p className="text-emerald-900 font-bold break-all">{agent.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 group/item cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center group-hover/item:bg-emerald-50 transition-colors shadow-sm">
                      <Phone className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-1">Phone Line</p>
                      <p className="text-emerald-900 font-bold">{agent.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 group/item cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center group-hover/item:bg-emerald-50 transition-colors shadow-sm">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-1">Office Location</p>
                      <p className="text-emerald-900 font-bold">{agent.city || "Mumbai, IND"}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-10 pt-0">
                  <div className="flex gap-4">
                    <button className="flex-grow bg-[#064E3B] text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-emerald-900 hover:shadow-xl hover:shadow-emerald-900/20 active:scale-95">
                      <MessageSquare className="w-5 h-5" />
                      CONSULT
                    </button>
                    <button className="w-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center border border-emerald-100 transition-all hover:bg-emerald-500 hover:text-white active:scale-95 group/btn">
                      <ChevronRight className="w-8 h-8 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Advisory Disclaimer */}
        <div className="mt-24 bg-emerald-900 text-emerald-100/40 p-12 rounded-[4rem] text-center border-t-8 border-emerald-400/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto mb-8 opacity-50 group-hover:scale-110 transition-transform duration-700" />
            <h4 className="text-2xl font-black text-white mb-6 tracking-wide">Distributor Trust & Verification</h4>
            <p className="max-w-3xl mx-auto text-lg leading-relaxed font-medium italic">All agents listed above are registered with the Association of Mutual Funds in India (AMFI). Please verify their ARN credentials independently on the AMFI portal before conducting high-value financial transactions.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest">KYC COMPLIANT</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest">FEE DISCLOSURE SIGNED</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest">AMFI REGISTERED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
