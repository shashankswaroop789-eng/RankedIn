import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 sm:p-8 space-y-5 text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-neutral-950">Privacy & Advertising Policy</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-neutral-600 leading-relaxed">
          <p>
            At <strong>RankIN Protocol</strong>, accessible from our official domain, one of our main priorities is the privacy of our visitors. This Privacy Policy document outlines the types of information collected and how we use it.
          </p>

          <h4 className="font-bold text-neutral-900 text-sm">1. Google AdSense & Third-Party Cookies</h4>
          <p>
            Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites on the internet.
          </p>
          <p>
            Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to RankIN and/or other sites on the Internet.
          </p>
          <p>
            Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-neutral-900 font-semibold underline">Google Ads Settings</a> or by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-neutral-900 font-semibold underline">www.aboutads.info</a>.
          </p>

          <h4 className="font-bold text-neutral-900 text-sm">2. AI Search Query Data</h4>
          <p>
            When you enter a business name and city to run a visibility audit, that input is processed solely to simulate and benchmark real customer recommendation queries against generative AI engines (Google Gemini, Meta Llama, DeepSeek). We do not store or sell private business proprietary data.
          </p>

          <h4 className="font-bold text-neutral-900 text-sm">3. Log Files & Analytics</h4>
          <p>
            RankIN follows a standard procedure of using log files. The information collected includes internet protocol (IP) addresses, browser type, date/time stamps, and referring pages. These are not linked to personally identifiable information.
          </p>

          <h4 className="font-bold text-neutral-900 text-sm">4. Contact Us</h4>
          <p>
            If you have additional questions or require more information about our Privacy Policy, contact us at <strong>privacy@rankin.ai</strong>.
          </p>
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs transition"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
}
