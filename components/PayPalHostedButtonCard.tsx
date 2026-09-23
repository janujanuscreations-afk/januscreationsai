import React, { useEffect, useRef, useState } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { firestoreService } from '../services/firebase';

declare global {
  interface Window {
    paypal?: {
      HostedButtons?: (options: { hostedButtonId: string }) => {
        render: (selector: string | HTMLElement) => Promise<void>;
      };
      Buttons?: any;
    };
  }
}

export interface PayPalHostedButtonCardProps {
  hostedButtonId: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  defaultAmount?: number;
  description?: string;
  onPaymentSuccess?: (amount: number, txId: string) => void;
  creatorHandle?: string;
}

export const PayPalHostedButtonCard: React.FC<PayPalHostedButtonCardProps> = ({
  hostedButtonId,
  title,
  subtitle,
  badge = 'Live PayPal / Venmo',
  badgeColor = '#00F5D4',
  defaultAmount = 25.00,
  description = 'Supports credit cards, PayPal wallet, and Venmo checkout with instant clearing.',
  onPaymentSuccess,
  creatorHandle = '@JanuaryRebl'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const directUrl = `https://www.paypal.com/ncp/payment/${hostedButtonId}`;

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 15;

    const tryRenderHostedButton = () => {
      if (!isMounted) return;

      const container = document.getElementById(`paypal-container-${hostedButtonId}`);
      if (!container) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryRenderHostedButton, 400);
        }
        return;
      }

      if (window.paypal && typeof window.paypal.HostedButtons === 'function') {
        try {
          // Clear any stale children to avoid duplicate rendering
          container.innerHTML = '';
          window.paypal.HostedButtons({
            hostedButtonId: hostedButtonId,
          }).render(`#paypal-container-${hostedButtonId}`).then(() => {
            if (isMounted) {
              setIsRendered(true);
              setRenderError(null);
            }
          }).catch((err: any) => {
            console.warn(`PayPal HostedButtons render notice for ${hostedButtonId}:`, err);
            if (isMounted) {
              setRenderError(err?.message || 'PayPal Hosted Button ready in fallback mode');
            }
          });
        } catch (err: any) {
          console.warn('Error invoking PayPal HostedButtons:', err);
          if (isMounted) {
            setRenderError(err?.message || 'SDK render error');
          }
        }
      } else {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryRenderHostedButton, 400);
        } else {
          if (isMounted) {
            setRenderError('PayPal SDK loaded in direct link mode');
          }
        }
      }
    };

    tryRenderHostedButton();

    return () => {
      isMounted = false;
    };
  }, [hostedButtonId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    bossAudio.playSubtlePing();
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const txId = `PP-NCP-${Math.floor(Math.random() * 9000000) + 1000000}`;
      const netCreatorCut = +(defaultAmount * 0.85).toFixed(2);
      const platformCut = +(defaultAmount * 0.15).toFixed(2);

      await firestoreService.recordRevenue({
        amount: defaultAmount,
        netAmount: netCreatorCut,
        platformCut: platformCut,
        source: 'Live Stream Tip',
        category: 'tips',
        description: `PayPal Hosted Button [${hostedButtonId}] payment settled (${txId})`,
        creatorName: 'January Rebl',
        creatorHandle: creatorHandle,
        status: 'settled',
        clientRef: txId
      });

      bossAudio.playTipChime(defaultAmount);
      triggerNeonExplosion({
        particleCount: 75,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'medium'
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(defaultAmount, txId);
      }
    } catch (e) {
      console.error('Error simulating PayPal hosted payment:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-[2rem] bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black border border-white/10 hover:border-[#00F5D4]/40 transition-all shadow-2xl relative overflow-hidden flex flex-col justify-between group">
      
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#0079C1]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#00F5D4]/10 transition-all"></div>

      <div className="space-y-4 relative z-10">
        
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span 
            className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm"
            style={{ 
              backgroundColor: `${badgeColor}15`, 
              borderColor: `${badgeColor}50`, 
              color: badgeColor 
            }}
          >
            <i className="fa-brands fa-paypal text-xs"></i>
            <span>{badge}</span>
          </span>

          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[#38BDF8] border border-blue-500/20 font-bold">
              <i className="fa-brands fa-vimeo mr-1"></i>Venmo Ready
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300 font-bold">USD</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h4 className="text-lg sm:text-xl font-serif font-black italic text-white group-hover:text-[#00F5D4] transition-colors">
            {title}
          </h4>
          <p className="text-xs font-mono text-gray-300 mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Description / Revenue split info */}
        <p className="text-[11px] font-mono text-gray-400">
          {description}
        </p>

        {/* Hosted Button Container */}
        <div className="p-4 rounded-2xl bg-black/70 border border-white/10 flex flex-col items-center justify-center min-h-[100px] text-center relative">
          
          {/* Official PayPal SDK Target Container */}
          <div 
            id={`paypal-container-${hostedButtonId}`} 
            ref={containerRef}
            className="w-full flex justify-center py-2"
          ></div>

          {/* Dynamic Fallback / Direct Link button if SDK container is preparing */}
          {(!isRendered || renderError) && (
            <div className="w-full space-y-3">
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#0079C1] via-[#00457C] to-[#0079C1] hover:from-[#008AE6] hover:to-[#005599] text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-[#0079C1]/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <i className="fa-brands fa-paypal text-base text-[#38BDF8]"></i>
                <span>Pay with PayPal or Venmo</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>

              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-gray-400">
                <i className="fa-solid fa-shield-halved text-green-400"></i>
                <span>Hosted Button ID: <code className="text-white font-bold">{hostedButtonId}</code></span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Card Actions Footer */}
      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs font-mono relative z-10">
        
        <button
          type="button"
          onClick={handleCopyLink}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-[11px]"
          title="Copy direct payment link"
        >
          <i className={`fa-solid ${copiedLink ? 'fa-check text-green-400' : 'fa-copy text-gray-400'}`}></i>
          <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
        </button>

        <button
          type="button"
          onClick={handleSimulatePayment}
          disabled={isSimulating}
          className="px-3.5 py-2 rounded-xl bg-[#00F5D4]/15 hover:bg-[#00F5D4]/25 border border-[#00F5D4]/30 text-[#00F5D4] text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          title="Simulate instant settlement & wallet credit"
        >
          <i className={`fa-solid ${isSimulating ? 'fa-spinner fa-spin' : 'fa-bolt'}`}></i>
          <span>{isSimulating ? 'Clearing...' : `Simulate +$${defaultAmount}`}</span>
        </button>

      </div>

    </div>
  );
};

export default PayPalHostedButtonCard;
