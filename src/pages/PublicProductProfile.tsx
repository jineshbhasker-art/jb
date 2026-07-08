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
  Compass,
  Heart,
  RefreshCw,
  Info,
  QrCode
} from 'lucide-react';
import { productsService, businessProfileService } from '../lib/dbService';
import { Product, BusinessProfile } from '../types';
import { formatCurrency } from '../lib/utils';
import PerfumeViewer3D from '../components/PerfumeViewer3D';
import ScentSpiderChart from '../components/ScentSpiderChart';

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

interface PublicProductProfileProps {
  productId: string;
}

export default function PublicProductProfile({ productId }: PublicProductProfileProps) {
  const [product, setProduct] = React.useState<Product | null>(null);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  // Custom interactive configs for users on the profile page
  const [selectedMl, setSelectedMl] = React.useState<number>(100);
  const [customEngraving, setCustomEngraving] = React.useState<string>('');
  const [isEngravingMode, setIsEngravingMode] = React.useState<boolean>(false);
  const [liked, setLiked] = React.useState<boolean>(false);

  React.useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const [prod, bizProfile] = await Promise.all([
          productsService.getById(productId),
          businessProfileService.get()
        ]);

        if (bizProfile) {
          setProfile(bizProfile);
        }

        if (prod) {
          setProduct(prod);
        } else {
          setError('Perfume profile not found. Verify bottle identifier.');
        }
      } catch (err) {
        console.error('Error loading public product profile:', err);
        setError('Synchronizing latency occurred. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const handleReturnToLogin = () => {
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
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-[#C5A059]">CALIBRATING INTERACTIVE 3D</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Loading molecular profiles & flacon renders...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center p-6 calibrate-grid">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[2.5rem] backdrop-blur-2xl text-center space-y-8 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-400 border border-red-500/20">
            <Package size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black uppercase tracking-tight text-white">PROFILE NOT DECODED</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
              {error || 'The requested perfume profile could not be resolved.'}
            </p>
          </div>
          <button 
            onClick={handleReturnToLogin}
            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={12} /> Return to Staff Portal
          </button>
        </div>
      </div>
    );
  }

  const brandFallback = LUXURY_FALLBACKS[product.brand] || DEFAULT_FALLBACK;
  const activeScentFamily = product.scentFamily || brandFallback.scentFamily;
  const activeConcentration = product.concentration || brandFallback.concentration;
  const activeTopNotes = product.topNotes || brandFallback.topNotes;
  const activeMiddleNotes = product.middleNotes || brandFallback.middleNotes;
  const activeBaseNotes = product.baseNotes || brandFallback.baseNotes;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden relative pb-24 calibrate-grid">
      {/* Luxurious Background Glowing Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-[#C5A059]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[50%] aspect-square bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Brand Banner */}
      <div className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-white/5 relative z-50">
        <div className="flex items-center gap-3">
          <Sparkles className="text-[#C5A059]" size={20} />
          <div>
            <h1 className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-400">SCENTS & SOULS</h1>
            <p className="text-[8px] font-bold tracking-[0.2em] text-[#C5A059] uppercase">Interactive Perfume Vault</p>
          </div>
        </div>

        <button 
          onClick={handleReturnToLogin}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black tracking-[0.2em] uppercase text-gray-300 transition-all border border-white/5 flex items-center gap-2"
        >
          <ArrowLeft size={10} /> BACK TO LAB PORTAL
        </button>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Left Interactive 3D Flacon Container */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-6 left-6 text-[8px] font-black uppercase tracking-[0.3em] text-[#C5A059] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PHYSICAL EMULATION BOTTLE
            </div>

            {/* Hearts like action */}
            <button 
              onClick={() => setLiked(!liked)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all border border-white/5"
            >
              <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-gray-400"} />
            </button>

            {/* Custom 3D bottle renderer */}
            <div className="pt-6">
              <PerfumeViewer3D
                configuringProduct={product}
                selectedMl={selectedMl}
                selectedConcentration={activeConcentration}
                customEngraving={customEngraving}
                LUXURY_FALLBACKS={LUXURY_FALLBACKS}
                ML_OPTIONS={ML_OPTIONS}
              />
            </div>
          </div>

          {/* Interactive Customization Controls for the client */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] space-y-6 backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Compass className="text-[#C5A059]" size={16} />
                <h3 className="text-[9px] font-black uppercase tracking-[0.25em]">Customize Flacon Display</h3>
              </div>
              <span className="text-[7px] font-mono text-[#C5A059] uppercase tracking-widest">Client Sandbox</span>
            </div>

            <div className="space-y-6">
              {/* Bottle size selector */}
              <div className="space-y-3">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Flacon Size</label>
                <div className="grid grid-cols-5 gap-2">
                  {ML_OPTIONS.map(opt => (
                    <button
                      key={opt.size}
                      onClick={() => setSelectedMl(opt.size)}
                      className={`py-3 rounded-xl border font-mono text-[9px] font-black transition-all ${
                        selectedMl === opt.size 
                          ? 'bg-[#C5A059] text-black border-[#C5A059] scale-105' 
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300'
                      }`}
                    >
                      {opt.size}ml
                    </button>
                  ))}
                </div>
              </div>

              {/* Laser Engraving sandbox */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Laser Etching Preview</label>
                  <button 
                    onClick={() => {
                      setIsEngravingMode(!isEngravingMode);
                      if (isEngravingMode) setCustomEngraving('');
                    }}
                    className="text-[8px] font-black text-[#C5A059] hover:underline uppercase tracking-wider"
                  >
                    {isEngravingMode ? 'RESET ETCHING' : 'CUSTOMIZE'}
                  </button>
                </div>
                {isEngravingMode && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <input 
                      type="text"
                      maxLength={20}
                      value={customEngraving}
                      onChange={e => setCustomEngraving(e.target.value.toUpperCase())}
                      placeholder="ETCH TEXT HERE (MAX 20 CHARS)..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono tracking-widest text-white outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                    <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Preview rendered live on the glass model above.</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Details, Pyramid & Care Instructions */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Main Perfume Info Card */}
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 p-10 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C5A059]/10 rounded-full border border-[#C5A059]/15">
                <span className="w-1 h-1 bg-[#C5A059] rounded-full animate-ping" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#C5A059]">{activeScentFamily}</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white leading-none">
                {product.name}
              </h2>
              <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#C5A059] font-black">
                {product.brand.toUpperCase()} • {activeConcentration.replace(/\s*\(.*\)/, '').toUpperCase()}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-gray-400 max-w-md leading-relaxed">
                Handcrafted premium perfume formulation cataloged in the {profile?.companyName || 'Scents & Souls'} inventory core system. Authorized retail flacon available for customized engraving and bespoke luxury packaging.
              </p>
            </div>

            <div className="p-6 bg-[#C5A059]/10 border border-[#C5A059]/10 rounded-3xl shrink-0 text-center space-y-1">
              <span className="text-[8px] font-black text-gray-400 block uppercase tracking-widest">RETAIL PRICE</span>
              <div className="text-2xl font-black text-white font-display">
                {formatCurrency(product.sellingPrice)}
              </div>
              <span className="text-[7px] text-[#C5A059] block uppercase tracking-widest font-bold">VAT Inclusive (5%)</span>
            </div>
          </div>

          {/* Scent Family Spider Chart */}
          <ScentSpiderChart product={product} />

          {/* Scent Pyramid Breakdown */}
          <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-6 backdrop-blur-3xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 justify-between">
              <div className="flex items-center gap-3">
                <Compass className="text-[#C5A059]" size={18} />
                <h3 className="text-xs font-black uppercase tracking-[0.25em]">Olfactory pyramid formula</h3>
              </div>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{product.sku}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[9px] text-gray-400">
              <div className="bg-white/[0.01] hover:bg-white/[0.03] p-6 rounded-2xl border border-white/5 space-y-3 transition-all group">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white font-black block tracking-widest text-[8px] uppercase">TOP NOTES</span>
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                </div>
                <p className="leading-relaxed text-gray-300 uppercase text-[8px] group-hover:text-white transition-colors">{activeTopNotes}</p>
                <span className="text-[7px] text-[#C5A059] block uppercase tracking-widest font-black">Initial 15 Min</span>
              </div>
              <div className="bg-white/[0.01] hover:bg-white/[0.03] p-6 rounded-2xl border border-white/5 space-y-3 transition-all group">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white font-black block tracking-widest text-[8px] uppercase">HEART NOTES</span>
                  <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full" />
                </div>
                <p className="leading-relaxed text-gray-300 uppercase text-[8px] group-hover:text-white transition-colors">{activeMiddleNotes}</p>
                <span className="text-[7px] text-[#C5A059] block uppercase tracking-widest font-black">2 - 4 Hours Sillage</span>
              </div>
              <div className="bg-white/[0.01] hover:bg-white/[0.03] p-6 rounded-2xl border border-white/5 space-y-3 transition-all group">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white font-black block tracking-widest text-[8px] uppercase">BASE NOTES</span>
                  <span className="w-1.5 h-1.5 bg-amber-800 rounded-full" />
                </div>
                <p className="leading-relaxed text-gray-300 uppercase text-[8px] group-hover:text-white transition-colors">{activeBaseNotes}</p>
                <span className="text-[7px] text-[#C5A059] block uppercase tracking-widest font-black">6 - 12 Hours Longevity</span>
              </div>
            </div>
          </div>

          {/* Scent Preservation and Care Guidelines */}
          <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] backdrop-blur-3xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-5">
              <BookOpen className="text-[#C5A059]" size={18} />
              <h3 className="text-xs font-black uppercase tracking-[0.25em]">Luxury Scent Care Protocols</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[9px] leading-relaxed">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#C5A059]">
                  <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '10s' }} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white uppercase tracking-wider">I. Handcrafted Ageing (Maceration)</h4>
                  <p className="text-gray-400">
                    Hand-poured extracts often require a brief stabilization period. Leave the flacon stored in a completely dark environment at room temperature for up to 14 days to maximize aromatic richness.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#C5A059]">
                  <Droplets size={14} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white uppercase tracking-wider">II. Radiant Pulse Point Strategy</h4>
                  <p className="text-gray-400">
                    For enhanced projection, apply immediately after showering on dry, warm pulse regions (such as collarbones, neckline, and wrists). Hydrate skin first to delay absorption of oils.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#C5A059]">
                  <Clock size={14} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white uppercase tracking-wider">III. Thermal Stabilization</h4>
                  <p className="text-gray-400">
                    Store bottles strictly away from direct sunshine, warm bathroom moisture, or vehicle dashboards. Optimal ambient temperatures range between 16-22°C to safeguard fragrance molecules.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#C5A059]">
                  <ShieldCheck size={14} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white uppercase tracking-wider">IV. Olfactory Integrity</h4>
                  <p className="text-gray-400">
                    Never rub freshly sprayed regions together. Frictional shear fractures subtle top notes, disrupting the fragrance development lifecycle and leading to premature evaporation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Boutique Registry details */}
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] text-gray-500 uppercase tracking-widest font-mono">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-[#C5A059]" />
              <span>REGISTRY CODE: {product.barcode || '7293810283'}</span>
            </div>
            <div>
              <span>BOUTIQUE TRN: {profile?.trn || '100492810200003'}</span>
            </div>
            <div>
              <span>VERIFIED ORIGINAL SECURE PRODUCT</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
