import React from 'react';
import QRCode from 'react-qr-code';
import { Product, BusinessProfile } from '../types';
import { formatCurrency } from '../lib/utils';
import { Sparkles, Compass } from 'lucide-react';
import { businessProfileService } from '../lib/dbService';

interface PrintShelfTalkersProps {
  products: Product[];
  includeNotes: boolean;
  includeQrCode: boolean;
  themeStyle: 'luxury-dark' | 'minimalist-light' | 'boutique-gold';
  labelSize: 'standard' | 'large' | 'compact';
}

const LUXURY_FALLBACKS: Record<string, {
  scentFamily: string;
  concentration: string;
  topNotes: string;
  middleNotes: string;
  baseNotes: string;
}> = {
  'Amouage': {
    scentFamily: 'Woody & Spicy',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Saffron, Lavender, Pink Pepper',
    middleNotes: 'Oud Wood, Jasmine, Nutmeg',
    baseNotes: 'Ambergris, Musk, Sandalwood'
  },
  'Creed': {
    scentFamily: 'Citrus & Fresh',
    concentration: 'Extrait de Parfum (20-40%)',
    topNotes: 'Pineapple, Bergamot, Apple',
    middleNotes: 'Birch, Patchouli, Jasmine',
    baseNotes: 'Musk, Oakmoss, Ambergris'
  },
  'Maison Francis Kurkdjian': {
    scentFamily: 'Musk & Amber',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Saffron, Jasmine',
    middleNotes: 'Amberwood, Ambergris',
    baseNotes: 'Fir Resin, Cedar'
  },
  'Lattafa': {
    scentFamily: 'Oud & Oriental',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Cinnamon, Nutmeg, Bergamot',
    middleNotes: 'Dates, Praline, Tuberose',
    baseNotes: 'Vanilla, Tonka Bean, Amber'
  },
  'Rasasi': {
    scentFamily: 'Citrus & Fresh',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Apple, Grapefruit, Lemon',
    middleNotes: 'Watery Notes, Jasmine',
    baseNotes: 'Ambergris, Musk, Cedar'
  },
  'Scents & Souls': {
    scentFamily: 'Bespoke Blends',
    concentration: 'Extrait de Parfum (20-40%)',
    topNotes: 'Royal Oud, Saffron Dust',
    middleNotes: 'Damask Rose, Midnight Amber',
    baseNotes: 'Siberian Musk, Warm Vetiver'
  },
  'Swiss Arabian': {
    scentFamily: 'Oud & Oriental',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Saffron',
    middleNotes: 'Agarwood (Oud), Rose',
    baseNotes: 'Ambergris, Musk, Sandalwood'
  }
};

const DEFAULT_FALLBACK = {
  scentFamily: 'Bespoke Blend',
  concentration: 'Eau de Parfum (EDP)',
  topNotes: 'Royal Bergamot, Saffron Petals',
  middleNotes: 'Damask Rose, Warm Amberwood',
  baseNotes: 'Siberian Musk, Indonesian Patchouli'
};

export const PrintShelfTalkers = React.forwardRef<HTMLDivElement, PrintShelfTalkersProps>(({
  products,
  includeNotes,
  includeQrCode,
  themeStyle,
  labelSize
}, ref) => {
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const data = await businessProfileService.get();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  // Set physical dimensions based on selections
  // standard: 3.5in x 4in (approx 89mm x 102mm)
  // large: 4in x 5in (approx 102mm x 127mm)
  // compact: 3in x 3in (approx 76mm x 76mm)
  const sizeClasses = {
    standard: 'w-[89mm] h-[102mm] p-[6mm]',
    large: 'w-[102mm] h-[127mm] p-[8mm]',
    compact: 'w-[76mm] h-[76mm] p-[4mm]'
  };

  const getProfileUrl = (id: string) => {
    return `${window.location.origin}/?product-profile=${id}`;
  };

  return (
    <div ref={ref} className="bg-white text-black print-container font-sans">
      {/* Printable page layout - uses CSS Grid/Flex for multi-label arrangement */}
      <div className="flex flex-wrap gap-[5mm] justify-center p-[10mm] print:p-0 print:gap-0 print:block">
        {products.map((product) => {
          const fallback = LUXURY_FALLBACKS[product.brand] || DEFAULT_FALLBACK;
          const family = product.scentFamily || fallback.scentFamily;
          const conc = product.concentration || fallback.concentration;
          const topN = product.topNotes || fallback.topNotes;
          const midN = product.middleNotes || fallback.middleNotes;
          const baseN = product.baseNotes || fallback.baseNotes;

          const isDark = themeStyle === 'luxury-dark';
          const isGold = themeStyle === 'boutique-gold';

          return (
            <div
              key={product.id}
              className={`
                relative overflow-hidden flex flex-col justify-between select-none
                border-2 border-dashed border-gray-300 print:border-gray-400
                print:break-inside-avoid print:mb-[4mm] print:inline-block
                ${sizeClasses[labelSize]}
                ${isDark ? 'bg-black text-white border-dashed border-zinc-700' : ''}
                ${isGold ? 'bg-[#FAF7F2] text-amber-950 border-amber-200' : 'bg-white'}
              `}
              style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
            >
              {/* Decorative Header Border Accent */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] ${
                isDark ? 'bg-[#C5A059]' : isGold ? 'bg-[#C5A059]' : 'bg-black'
              }`} />

              {/* Retail Brand Banner */}
              <div className="flex items-center justify-between border-b pb-[2mm] border-gray-100 print:border-gray-200">
                <div className="flex items-center gap-1">
                  <Sparkles size={10} className={isDark ? 'text-[#C5A059]' : 'text-amber-600'} />
                  <span className={`text-[7px] font-black tracking-[0.25em] uppercase ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {profile?.companyName || 'SCENTS & SOULS'}
                  </span>
                </div>
                <span className={`text-[6px] font-bold tracking-widest uppercase ${
                  isDark ? 'text-[#C5A059]' : 'text-amber-700'
                }`}>
                  {product.brand || 'Bespoke Lab'}
                </span>
              </div>

              {/* Perfume Identifiers */}
              <div className="my-[1.5mm] flex-1 flex flex-col justify-center">
                <h2 className={`font-black uppercase tracking-tight leading-[1.1] ${
                  labelSize === 'large' ? 'text-sm' : labelSize === 'compact' ? 'text-[10px]' : 'text-xs'
                }`}>
                  {product.name}
                </h2>
                <div className="flex flex-wrap items-center gap-[1.5mm] mt-[1mm]">
                  <span className={`text-[6px] font-black px-1 py-[0.2mm] rounded uppercase tracking-wider ${
                    isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {family}
                  </span>
                  <span className={`text-[6px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-[#C5A059]' : 'text-amber-700'
                  }`}>
                    {conc.replace(/\s*\(.*\)/, '')}
                  </span>
                </div>
              </div>

              {/* Olfactory Notes (Hidden if disabled or in compact mode if notes don't fit) */}
              {includeNotes && labelSize !== 'compact' && (
                <div className="my-[1.5mm] py-[1.5mm] border-t border-b border-gray-50 print:border-gray-100 space-y-[0.8mm] font-mono">
                  <div className="flex gap-[1mm] items-start text-[6.5px] leading-tight">
                    <span className="font-black text-[#C5A059] shrink-0 uppercase tracking-widest text-[5.5px] bg-[#C5A059]/10 px-0.5 py-[0.1mm] rounded">TOP:</span>
                    <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{topN}</span>
                  </div>
                  <div className="flex gap-[1mm] items-start text-[6.5px] leading-tight">
                    <span className="font-black text-[#C5A059] shrink-0 uppercase tracking-widest text-[5.5px] bg-[#C5A059]/10 px-0.5 py-[0.1mm] rounded">MID:</span>
                    <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{midN}</span>
                  </div>
                  <div className="flex gap-[1mm] items-start text-[6.5px] leading-tight">
                    <span className="font-black text-[#C5A059] shrink-0 uppercase tracking-widest text-[5.5px] bg-[#C5A059]/10 px-0.5 py-[0.1mm] rounded">BASE:</span>
                    <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{baseN}</span>
                  </div>
                </div>
              )}

              {/* Pricing & Interactive QR Code Footer */}
              <div className="flex items-end justify-between pt-[1.5mm] border-t border-gray-100 print:border-gray-200 mt-auto">
                <div className="space-y-[0.5mm]">
                  <span className={`text-[6px] block font-bold tracking-widest uppercase ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Retail Price
                  </span>
                  <div className={`font-black font-serif leading-none ${
                    labelSize === 'large' ? 'text-base' : 'text-sm'
                  } ${isDark ? 'text-white' : 'text-black'}`}>
                    {formatCurrency(product.sellingPrice)}
                  </div>
                  <span className={`text-[5px] block font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    VAT Inclusive (5%)
                  </span>
                </div>

                {/* QR Code leading to public profile + 3D interactive viewer */}
                {includeQrCode && (
                  <div className="flex flex-col items-center gap-[0.8mm] shrink-0">
                    <div className={`p-1 rounded bg-white ${
                      isDark ? 'ring-1 ring-white/20' : 'ring-1 ring-black/5'
                    }`}>
                      <QRCode
                        value={getProfileUrl(product.id || '')}
                        size={labelSize === 'large' ? 44 : labelSize === 'compact' ? 32 : 38}
                        style={{ height: 'auto', width: labelSize === 'large' ? 44 : labelSize === 'compact' ? 32 : 38 }}
                      />
                    </div>
                    <span className={`text-[4.5px] font-black tracking-wider uppercase text-center ${
                      isDark ? 'text-[#C5A059]' : 'text-amber-800'
                    }`}>
                      SCAN FOR 3D PREVIEW
                    </span>
                  </div>
                )}
              </div>

              {/* Card Dotted Boundary Guide lines info for printing cutouts */}
              <div className="absolute bottom-1 left-2 text-[4px] opacity-10 font-bold uppercase tracking-widest">
                FOLD GUIDE • CUT ALONG DASHED
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

PrintShelfTalkers.displayName = 'PrintShelfTalkers';
