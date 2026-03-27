import { useEffect } from 'react';

interface AdSenseProps {
  slot: string; // Your ad slot ID
  client?: string; // Optional custom publisher ID (defaults to placeholder)
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
}

const AdSense = ({ slot, client = "ca-pub-9459736187616338", format = 'auto', style, className }: AdSenseProps) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, [slot]); // Re-run if slot changes, though usually it won't

  return (
    <div className={`flex justify-center my-8 overflow-hidden w-full ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '300px', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSense;
