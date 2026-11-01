import React, { useEffect, useRef } from 'react';

/**
 * Production-ready Google AdSense Banner Component for React SPAs.
 * Safely handles React lifecycle mount/unmount and avoids duplicate push errors.
 */
export default function AdSenseBanner({
  adSlot = '1234567890',
  adClient = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-1017109748072844',
  adFormat = 'auto',
  fullWidthResponsive = 'true',
  className = '',
  label = 'Advertisement'
}) {
  const isPushed = useRef(false);

  useEffect(() => {
    // Only push if live AdSense client is configured and not the placeholder
    if (adClient && adClient.startsWith('ca-pub-') && adClient !== 'ca-pub-XXXXXXXXXXXXXXXX' && !isPushed.current) {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isPushed.current = true;
        }
      } catch (err) {
        console.warn('[AdSense] Ad push error:', err);
      }
    }
  }, [adClient, adSlot]);

  const isLiveConfigured = adClient && adClient.startsWith('ca-pub-') && adClient !== 'ca-pub-XXXXXXXXXXXXXXXX';

  if (!isLiveConfigured) {
    return (
      <div className={`w-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 p-4 sm:p-5 text-center my-4 ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
          <span>Google AdSense Slot</span>
          <span className="font-mono text-neutral-400">Slot ID: {adSlot}</span>
        </div>
        <div className="py-2">
          <p className="text-xs font-semibold text-neutral-800">
            Google AdSense Responsive Unit
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Auto-serves contextual ads to local business owners checking their AI visibility score.
          </p>
        </div>
        <div className="text-[10px] text-neutral-400 border-t border-neutral-200/60 pt-2 flex items-center justify-center gap-1.5">
          <span>Add your <code className="bg-neutral-200/70 px-1.5 py-0.5 rounded text-neutral-700 font-mono">ca-pub-...</code> ID in <code className="bg-neutral-200/70 px-1.5 py-0.5 rounded text-neutral-700 font-mono">index.html</code> to display live ads.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden text-center my-4 ${className}`}>
      {label && (
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
          {label}
        </div>
      )}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
}
