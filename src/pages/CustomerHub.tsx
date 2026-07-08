import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Package, 
  Clock, 
  ShieldCheck, 
  Droplets, 
  ArrowLeft, 
  BookOpen, 
  ExternalLink,
  Volume2,
  Compass,
  Heart,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { salesService, businessProfileService } from '../lib/dbService';
import { Sale, SaleItem, BusinessProfile } from '../types';
import { formatCurrency } from '../lib/utils';
import { BRANDS } from '../constants';
import PerfumeViewer3D from '../components/PerfumeViewer3D';

// Luxury constants for the component
const LUXURY_FALLBACKS: Record<string, {
  scentFamily: string;
  concentration: string;
  topNotes: string;
  middleNotes: string;
  baseNotes: string;
  color: string;
}> = {
  'Amouage': {
    scentFamily: 'Woody & Spicy',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Saffron, Lavender, Bergamot, Pink Pepper',
    middleNotes: 'Oud Wood, Bulgarian Rose, Jasmine, Nutmeg',
    baseNotes: 'Ambergris, Musk, Patchouli, Sandalwood',
    color: 'from-amber-600/80 to-amber-900/90'
  },
  'Creed': {
    scentFamily: 'Citrus & Fresh',
    concentration: 'Extrait de Parfum (20-40%)',
    topNotes: 'Pineapple, Bergamot, Blackcurrant, Apple',
    middleNotes: 'Birch, Patchouli, Moroccan Jasmine, Rose',
    baseNotes: 'Musk, Oakmoss, Ambergris, Vanille',
    color: 'from-cyan-500/80 to-blue-900/90'
  },
  'Maison Francis Kurkdjian': {
    scentFamily: 'Musk & Amber',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Saffron, Jasmine',
    middleNotes: 'Amberwood, Ambergris',
    baseNotes: 'Fir Resin, Cedar',
    color: 'from-rose-500/80 to-purple-900/90'
  },
  'Lattafa': {
    scentFamily: 'Oud & Oriental',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Cinnamon, Nutmeg, Bergamot',
    middleNotes: 'Dates, Praline, Tuberose, Lily',
    baseNotes: 'Vanilla, Tonka Bean, Benzoin, Amber',
    color: 'from-orange-500/80 to-yellow-900/90'
  },
  'Rasasi': {
    scentFamily: 'Citrus & Fresh',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Apple, Grapefruit, Pineapple, Lemon',
    middleNotes: 'Watery Notes, Jasmine, Orange Blossom',
    baseNotes: 'Ambergris, Musk, Cedar, Driftwood',
    color: 'from-teal-500/80 to-emerald-900/90'
  },
  'Scents & Souls': {
    scentFamily: 'Bespoke Blends',
    concentration: 'Extrait de Parfum (20-40%)',
    topNotes: 'Royal Oud, Saffron Dust, White Truffle',
    middleNotes: 'Damask Rose, Midnight Amber, Frankincense',
    baseNotes: 'Siberian Musk, Warm Vetiver, Sandalwood Tears',
    color: 'from-amber-500/90 via-[#C5A059]/80 to-yellow-950/90'
  },
  'Swiss Arabian': {
    scentFamily: 'Oud & Oriental',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Saffron',
    middleNotes: 'Agarwood (Oud), Rose',
    baseNotes: 'Ambergris, Musk, Sandalwood, Praline',
    color: 'from-yellow-600/80 to-amber-950/90'
  },
  'Tom Ford': {
    scentFamily: 'Woody & Spicy',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Cognac, Cinnamon, Tonka Bean, Oak Wood',
    middleNotes: 'Praline, Sandalwood, Sweet Vanilla, Hazelnut',
    baseNotes: 'Amber, Oud Wood, Leather, Rich Patchouli',
    color: 'from-rose-950 via-amber-950 to-orange-950'
  },
  'Chanel': {
    scentFamily: 'French Florals',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Aldehydes, Ylang-Ylang, Neroli, Bergamot, Lemon',
    middleNotes: 'Iris, Jasmine, Rose, Orris Root, Lily of the Valley',
    baseNotes: 'Civet, Sandalwood, Amber, Musk, Moss, Vetiver, Vanilla',
    color: 'from-amber-200/90 via-yellow-400/80 to-yellow-600/90'
  },
  'Roja Parfums': {
    scentFamily: 'Bespoke Blends',
    concentration: 'Parfum Cologne (15-20%)',
    topNotes: 'Grapefruit, Lime, Lemon, Bergamot, Lavender, Musk',
    middleNotes: 'Lily of the Valley, Rose de Mai, Jasmine de Grasse, Apple',
    baseNotes: 'Galbanum, Pink Pepper, Cypriol, Vetiver, Cedarwood, Labdanum',
    color: 'from-emerald-600 to-amber-950'
  }
};

const DEFAULT_FALLBACK = {
  scentFamily: 'Bespoke Blend',
  concentration: 'Eau de Parfum (EDP) (15-20%)',
  topNotes: 'Royal Bergamot, Saffron Petals, Pink Pepper',
  middleNotes: 'Damask Rose, Warm Amberwood, Lily of the Valley',
  baseNotes: 'Siberian Musk, Indonesian Patchouli, Mysore Sandalwood',
  color: 'from-amber-500/90 via-[#C5A059]/80 to-yellow-950/90'
};

const ML_OPTIONS = [
  { size: 10, label: '10ml Atomizer', multiplier: 0.18, height: 18, desc: 'Travel decant vial' },
  { size: 30, label: '30ml Flacon', multiplier: 0.40, height: 38, desc: 'Sleek travel collection' },
  { size: 50, label: '50ml Parfum', multiplier: 0.65, height: 58, desc: 'Bespoke decant' },
  { size: 100, label: '100ml Signature', multiplier: 1.00, height: 80, desc: 'Signature flacon' },
  { size: 200, label: '200ml Imperial', multiplier: 1.75, height: 95, desc: 'Imperial oversized' }
];

interface CustomerHubProps {
  invoiceNumber: string;
}

export default function CustomerHub({ invoiceNumber }: CustomerHubProps) {
  const [sale, setSale] = React.useState<Sale | null>(null);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedItemIdx, setSelectedItemIdx] = React.useState<number>(0);

  // Load Sale and Business Profile on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [salesList, bizProfile] = await Promise.all([
          salesService.getAll(),
          businessProfileService.get()
        ]);

        if (bizProfile) {
          setProfile(bizProfile);
        }

        const foundSale = salesList?.find(s => s.invoiceNumber === invoiceNumber);
        if (foundSale) {
          setSale(foundSale);
        } else {
          setError(`Invoice ${invoiceNumber} not found in active system registers.`);
        }
      } catch (err) {
        console.error('Error loading Customer Hub details:', err);
        setError('A network or database sync latency occurred. Please refresh to reload.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [invoiceNumber]);

  const parseItemName = (name: string) => {
    // Extract Engraved
    let engraving = '';
    const engravedMatch = name.match(/\{Engraved:\s*"([^"]+)"\}/i);
    if (engravedMatch) {
      engraving = engravedMatch[1];
    }

    // Extract ML size
    let ml = 100;
    const mlMatch = name.match(/-\s*(\d+)ml/i);
    if (mlMatch) {
      ml = parseInt(mlMatch[1]);
    }

    // Extract Concentration Code
    let concentrationCode = 'EDP';
    const concMatch = name.match(/\[([^\]]+)\]/);
    if (concMatch) {
      concentrationCode = concMatch[1];
    }

    // Map Concentration Code back to label
    let concentrationLabel = 'Eau de Parfum (EDP) (15-20%)';
    if (concentrationCode === 'Extrait') {
      concentrationLabel = 'Extrait de Parfum (20-40%)';
    } else if (concentrationCode === 'EDT') {
      concentrationLabel = 'Eau de Toilette (EDT) (5-15%)';
    } else if (concentrationCode === 'EDC') {
      concentrationLabel = 'Eau de Cologne (EDC) (2-5%)';
    } else if (concentrationCode === 'Attar') {
      concentrationLabel = 'Concentrated Oil (Attar) (30-50%)';
    }

    // Pure clean name of the product
    let cleanName = name
      .replace(/\{Engraved:\s*"[^"]+"\}/gi, '')
      .replace(/\[[^\]]+\]/gi, '')
      .replace(/-\s*\d+ml/gi, '')
      .trim();

    // Map Brand
    let brand = 'Scents & Souls';
    for (const b of BRANDS) {
      if (name.toLowerCase().includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    return {
      cleanName,
      ml,
      concentrationCode,
      concentrationLabel,
      engraving,
      brand
    };
  };

  const handleReturnToLogin = () => {
    // Simply clear the query parameter from URL to reload standard flow
    window.history.pushState({}, '', window.location.pathname);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center p-6 calibrate-grid">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 border border-white/10 rounded-2xl flex items-center justify-center animate-spin">
            <RefreshCw className="text-[#C5A059]" size={28} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-[#C5A059]">AUTHENTICATING SYNC</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Retrieving high-resolution formulas & profiles...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center p-6 calibrate-grid">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[2.5rem] backdrop-blur-2xl text-center space-y-8 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-400 border border-red-500/20">
            <QrCode size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black uppercase tracking-tight text-white">DECRYPTION FAILURE</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
              {error || 'The requested luxury digital certificate could not be resolved.'}
            </p>
          </div>
          <button 
            onClick={handleReturnToLogin}
            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={12} /> Staff Portal login
          </button>
        </div>
      </div>
    );
  }

  // Filter items that are actually perfumes (productType === 'perfume' or similar, or just everything except repairs)
  const itemsWithViewer = sale.items.map((item, idx) => {
    const parsed = parseItemName(item.name);
    return {
      ...item,
      originalIdx: idx,
      parsed
    };
  });

  const activeItem = itemsWithViewer[selectedItemIdx] || itemsWithViewer[0];
  const activeFallback = LUXURY_FALLBACKS[activeItem.parsed.brand] || DEFAULT_FALLBACK;

  // Mock product object for 3D Viewer matching structure
  const mockProductFor3D = {
    id: activeItem.productId,
    name: activeItem.parsed.cleanName,
    sku: 'BESPOKE-CUST',
    barcode: '000000',
    type: 'perfume' as any,
    category: 'Oud & Oriental',
    brand: activeItem.parsed.brand,
    costPrice: activeItem.unitCost,
    sellingPrice: activeItem.unitPrice,
    stockQuantity: 100,
    minStockLevel: 5,
    imeiRequired: activeItem.imeiRequired || false,
    vatRate: 0.05,
    isActive: true,
    scentFamily: activeFallback.scentFamily,
    concentration: activeItem.parsed.concentrationLabel,
    topNotes: activeFallback.topNotes,
    middleNotes: activeFallback.middleNotes,
    baseNotes: activeFallback.baseNotes,
    createdAt: sale.createdAt,
    updatedAt: sale.createdAt
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden relative pb-24 calibrate-grid">
      {/* Premium Background Blurs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-[#C5A059]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[50%] aspect-square bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Rail */}
      <div className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-white/5 relative z-50">
        <div className="flex items-center gap-3">
          <Sparkles className="text-[#C5A059]" size={20} />
          <div>
            <h1 className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-400">SCENTS & SOULS</h1>
            <p className="text-[8px] font-bold tracking-[0.2em] text-[#C5A059] uppercase">Digital Scent Certificate</p>
          </div>
        </div>

        <button 
          onClick={handleReturnToLogin}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black tracking-[0.2em] uppercase text-gray-300 transition-all border border-white/5"
        >
          Staff login
        </button>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Left Interactive 3D Flacon Container */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-6 left-6 text-[8px] font-black uppercase tracking-[0.3em] text-[#C5A059] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Interactive 3D Hologram
            </div>

            {/* Custom 3D bottle renderer wrapped with Tailwind/custom components */}
            <div className="pt-6">
              <PerfumeViewer3D
                configuringProduct={mockProductFor3D}
                selectedMl={activeItem.parsed.ml}
                selectedConcentration={activeItem.parsed.concentrationLabel}
                customEngraving={activeItem.parsed.engraving}
                LUXURY_FALLBACKS={LUXURY_FALLBACKS}
                ML_OPTIONS={ML_OPTIONS}
              />
            </div>
          </div>

          {/* Scent Pyramid Profile Details */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] space-y-6 backdrop-blur-3xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Compass className="text-[#C5A059]" size={16} />
              <h3 className="text-[9px] font-black uppercase tracking-[0.25em]">Scent formulation breakdown</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[9px] text-gray-400">
              <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-white font-black block tracking-widest text-[8px] uppercase">TOP NOTES</span>
                <p className="leading-relaxed text-gray-400 uppercase text-[8px]">{activeFallback.topNotes}</p>
                <span className="text-[7px] text-[#C5A059] block uppercase tracking-widest">Initial 15 Min</span>
              </div>
              <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-white font-black block tracking-widest text-[8px] uppercase">HEART NOTES</span>
                <p className="leading-relaxed text-gray-400 uppercase text-[8px]">{activeFallback.middleNotes}</p>
                <span className="text-[7px] text-[#C5A059] block uppercase tracking-widest">2 - 4 Hours sillage</span>
              </div>
              <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-white font-black block tracking-widest text-[8px] uppercase">BASE NOTES</span>
                <p className="leading-relaxed text-gray-400 uppercase text-[8px]">{activeFallback.baseNotes}</p>
                <span className="text-[7px] text-[#C5A059] block uppercase tracking-widest">6 - 12 Hours longevity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tab Content & Purchase Details */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Main Greetings Card */}
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 p-10 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C5A059]/10 rounded-full border border-[#C5A059]/15">
                <span className="w-1 h-1 bg-[#C5A059] rounded-full" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Bespoke Order Verified</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
                GREETINGS, <span className="text-[#C5A059]">{sale.customerName?.split(' ')[0]}</span>
              </h2>
              <p className="text-[9px] uppercase tracking-widest text-gray-400 max-w-md leading-relaxed">
                Thank you for selecting <span className="text-white font-bold">{profile?.companyName || 'SCENTS & SOULS'}</span>. Below are the custom formula codes, molecular projections, and specific lab maintenance instructions for your perfumes.
              </p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl shrink-0 font-mono text-[9px] text-right space-y-1">
              <div className="flex justify-between md:justify-end gap-4">
                <span className="text-gray-500">INVOICE:</span>
                <span className="text-white font-black">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-4">
                <span className="text-gray-500">DATE:</span>
                <span className="text-white font-bold">{new Date(sale.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-4">
                <span className="text-gray-500">BOUTIQUE:</span>
                <span className="text-white font-bold uppercase">{sale.cashierName}</span>
              </div>
            </div>
          </div>

          {/* Purchased Items Selector Rail */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">Choose custom perfume bottle below</h3>
              <span className="text-[8px] font-mono text-[#C5A059]">{itemsWithViewer.length} item(s)</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {itemsWithViewer.map((item, idx) => {
                const isSelected = selectedItemIdx === idx;
                return (
                  <button
                    key={item.productId}
                    onClick={() => setSelectedItemIdx(idx)}
                    className={`px-6 py-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                      isSelected 
                        ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-xl' 
                        : 'bg-white/[0.01] hover:bg-white/[0.03] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isSelected ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-gray-400'
                    }`}>
                      <Package size={14} />
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wider line-clamp-1 max-w-[180px]">
                        {item.parsed.cleanName}
                      </div>
                      <div className="text-[8px] font-mono mt-0.5 uppercase tracking-widest opacity-60">
                        {item.parsed.ml}ml • {item.parsed.concentrationCode}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Care Instructions Panel */}
          <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] backdrop-blur-3xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-5 justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="text-[#C5A059]" size={18} />
                <h3 className="text-xs font-black uppercase tracking-[0.25em]">Specific Care & Ritual Guidelines</h3>
              </div>
              <span className="text-[8px] font-mono bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-3 py-1 rounded-full uppercase tracking-widest font-black">
                {activeItem.parsed.concentrationLabel.split('(')[0].trim()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[9px] leading-relaxed">
              {/* Care Point 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#C5A059]">
                  <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white uppercase tracking-wider">I. Molecular Maceration (Ageing)</h4>
                  <p className="text-gray-400">
                    Because this flacon is fresh-filled and handcrafted to order with <span className="text-white font-bold">{activeItem.parsed.ml}ml</span> of premium fluid, let the bottle rest in a cool, dark room for 14 days. This maturation period lets top notes align and maximizes the base projection.
                  </p>
                </div>
              </div>

              {/* Care Point 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#C5A059]">
                  <Droplets size={14} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white uppercase tracking-wider">II. Application & Projection Pulse Points</h4>
                  <p className="text-gray-400">
                    Always apply directly onto warmed skin (pulse points such as collarbones, wrists, and neck folds) immediately after a shower. Ensure skin is moisturized first; dry skin absorbs oil compounds faster, dampening sillage.
                  </p>
                </div>
              </div>

              {/* Care Point 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#C5A059]">
                  <Clock size={14} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white uppercase tracking-wider">III. Storage & Thermal Stabilization</h4>
                  <p className="text-gray-400">
                    Maintain the bottle at a constant temperature of 16-22°C (60-71°F). Avoid damp bathrooms, direct UV sunshine, or dashboard heatwaves. Extreme heat breaks down top-tier oils within weeks.
                  </p>
                </div>
              </div>

              {/* Care Point 4 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#C5A059]">
                  <ShieldCheck size={14} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white uppercase tracking-wider">IV. Scent Structure Preservation</h4>
                  <p className="text-gray-400">
                    Do not rub your wrists together after spraying. The high friction shear ruptures the top note molecular bonds, leading to premature dry-down and skipping the initial olfactory phase.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom engraving highlight */}
            {activeItem.parsed.engraving && (
              <div className="bg-[#C5A059]/5 border border-[#C5A059]/20 p-6 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[7px] font-black uppercase tracking-[0.25em] text-[#C5A059]">Custom Etched Keepsake</span>
                  <p className="text-[10px] text-white font-serif italic">"{activeItem.parsed.engraving}"</p>
                </div>
                <div className="text-[7px] font-mono text-gray-500 uppercase tracking-widest text-right">
                  LASER CALIBRATED ENGRAVING
                </div>
              </div>
            )}
          </div>

          {/* Secure Digital Registry Receipt breakdown */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] backdrop-blur-3xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Package className="text-[#C5A059]" size={16} />
              <h3 className="text-[9px] font-black uppercase tracking-[0.25em]">SECURE DIGITAL RECEIPT</h3>
            </div>

            <div className="space-y-3 font-mono text-[9px]">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-gray-400 py-1 border-b border-white/[0.02] last:border-0">
                  <span className="text-white uppercase font-bold">{item.name} x {item.quantity}</span>
                  <span className="text-white font-black">{formatCurrency(item.totalWithVat)}</span>
                </div>
              ))}

              <div className="pt-4 space-y-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase">SUBTOTAL</span>
                  <span className="text-gray-300">{formatCurrency(sale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase">VAT (5%)</span>
                  <span className="text-gray-300">{formatCurrency(sale.vatTotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span className="uppercase">DISCOUNT PROMO</span>
                    <span>-{formatCurrency(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black text-[#C5A059] pt-2 border-t border-dashed border-white/10">
                  <span>TOTAL AED</span>
                  <span>{formatCurrency(sale.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
