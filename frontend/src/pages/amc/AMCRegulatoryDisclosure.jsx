import React, { useState } from "react";

const amcDisclosures = [
  {
    title: "AMC Compliance Policy",
    content:
      "Our AMC strictly adheres to SEBI regulations and guidelines to ensure investor protection, transparency in operations, and timely disclosures of all material information.",
  },
  {
    title: "Fund Risk Management",
    content:
      "We follow rigorous risk management practices designed to minimize risks, diversify portfolios effectively, and maintain fund performance in varying market conditions.",
  },
  {
    title: "Investor Communication",
    content:
      "Regular updates are provided to investors including NAV announcements, portfolio performance reports, and notification of any scheme changes or dividends.",
  },
  {
    title: "Complaint Redressal Mechanism",
    content:
      "Investors may register grievances through the RTA or directly with the AMC compliance team. All complaints are addressed on priority with transparent resolution timelines.",
  },
];

export default function AMCRegulatoryDisclosure() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Filter disclosures by search term in title or content
  const filteredDisclosures = amcDisclosures.filter(
    ({ title, content }) =>
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">AMC Regulatory Disclosures</h1>
        <input
          type="text"
          placeholder="Search disclosures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-6 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search AMC Regulatory Disclosures"
        />

        <section className="space-y-4" role="region" aria-live="polite" aria-atomic="true">
          {filteredDisclosures.length === 0 ? (
            <p className="text-center text-gray-500">No matching disclosures found.</p>
          ) : (
            filteredDisclosures.map(({ title, content }, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <article key={idx} className="bg-white shadow rounded-lg">
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="w-full text-left p-6 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-expanded={isExpanded}
                    aria-controls={`disclosure-content-${idx}`}
                    id={`disclosure-header-${idx}`}
                  >
                    <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
                    <span
                      aria-hidden="true"
                      className={`transform transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                  {isExpanded && (
                    <div
                      id={`disclosure-content-${idx}`}
                      aria-labelledby={`disclosure-header-${idx}`}
                      className="px-6 pb-6 text-gray-700 leading-relaxed whitespace-pre-line"
                    >
                      {content}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
