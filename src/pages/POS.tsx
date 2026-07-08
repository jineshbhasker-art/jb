/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Trash2, 
  Plus, 
  Minus,
  ShoppingCart,
  Receipt,
  Package,
  X,
  Printer,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Sparkles,
  FlaskConical,
  Save,
  BookOpen,
  ScanBarcode
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Product, SaleItem, PaymentMethod, ProductType } from '../types';
import { CURRENCY_SYMBOL, VAT_RATE } from '../constants';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

// Mock Products
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Amouage Reflection Man EDP 100ml', sku: 'AMG-RFM-100', barcode: '6291234567812', type: ProductType.NEW, category: 'Woody & Spicy', brand: 'Amouage', costPrice: 750, sellingPrice: 1050, stockQuantity: 20, minStockLevel: 5, imeiRequired: true, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Creed Aventus Extrait de Parfum 100ml', sku: 'CRD-AVT-100', barcode: '6291234567829', type: ProductType.NEW, category: 'Citrus & Fresh', brand: 'Creed', costPrice: 850, sellingPrice: 1250, stockQuantity: 15, minStockLevel: 3, imeiRequired: true, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', name: 'MFK Baccarat Rouge 540 EDP 70ml', sku: 'MFK-BR540-70', barcode: '6291234567836', type: ProductType.NEW, category: 'Musk & Amber', brand: 'Maison Francis Kurkdjian', costPrice: 900, sellingPrice: 1350, stockQuantity: 12, minStockLevel: 2, imeiRequired: true, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '4', name: 'Lattafa Khamrah EDP 100ml', sku: 'LTF-KMH-100', barcode: '6291112223344', type: ProductType.NEW, category: 'Oud & Oriental', brand: 'Lattafa', costPrice: 45, sellingPrice: 120, stockQuantity: 40, minStockLevel: 10, imeiRequired: false, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '5', name: 'Rasasi Hawas for Him EDP 100ml', sku: 'RSS-HWS-100', barcode: '6294445556668', type: ProductType.NEW, category: 'Citrus & Fresh', brand: 'Rasasi', costPrice: 65, sellingPrice: 160, stockQuantity: 30, minStockLevel: 8, imeiRequired: false, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '6', name: 'SNS Oud Imperial Bespoke Extract 50ml', sku: 'SNS-OIB-50', barcode: '6295556667771', type: ProductType.NEW, category: 'Bespoke Blends', brand: 'Scents & Souls', costPrice: 180, sellingPrice: 450, stockQuantity: 8, minStockLevel: 2, imeiRequired: true, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '7', name: 'Swiss Arabian Shaghaf Oud EDP 75ml', sku: 'SAB-SGO-75', barcode: '6296667778882', type: ProductType.NEW, category: 'Oud & Oriental', brand: 'Swiss Arabian', costPrice: 55, sellingPrice: 140, stockQuantity: 25, minStockLevel: 5, imeiRequired: false, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' },
  { id: '8', name: 'Empty Gold Perfume Atomizer 10ml', sku: 'SNS-ATO-10G', barcode: '6297778889993', type: ProductType.ACCESSORY, category: 'Accessories (Bottles/Boxes)', brand: 'Scents & Souls', costPrice: 15, sellingPrice: 35, stockQuantity: 100, minStockLevel: 15, imeiRequired: false, vatRate: 0.05, isActive: true, createdAt: '', updatedAt: '' }
];

import { productsService, salesService, transactionsService, customersService, businessProfileService, promoVouchersService } from '../lib/dbService';
import { Sale, SaleStatus, AccountingType, Customer } from '../types';
import { useAuth } from '../AuthContext';

// Dynamic Lazy Import for high frame rate 3D product viewer on POS
const PerfumeViewer3D = React.lazy(() => import('../components/PerfumeViewer3D'));

import { QRCodeSVG } from 'qrcode.react';

// Luxury Fallback Data for Perfumes missing explicit note fields
const LUXURY_FALLBACKS: Record<string, {
  scentFamily: string;
  concentration: string;
  topNotes: string;
  middleNotes: string;
  baseNotes: string;
  color: string; // CSS gradient colors for the 3D bottle fluid
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
    baseNotes: 'Agarwood (Oud), Praline, Vanilla',
    color: 'from-yellow-600/80 to-amber-950/90'
  }
};

// Standard luxury volume configs
const ML_OPTIONS = [
  { size: 10, label: '10ml Atomizer', multiplier: 0.18, height: 18, desc: 'Travel decant vial' },
  { size: 30, label: '30ml Flacon', multiplier: 0.40, height: 38, desc: 'Sleek travel collection' },
  { size: 50, label: '50ml Parfum', multiplier: 0.65, height: 58, desc: 'Bespoke decant' },
  { size: 100, label: '100ml Signature', multiplier: 1.00, height: 80, desc: 'Signature flacon' },
  { size: 200, label: '200ml Imperial', multiplier: 1.75, height: 95, desc: 'Imperial oversized' }
];

// Scent Note options for Custom Blend Creator
const TOP_NOTE_OPTIONS = ['Bergamot', 'Grapefruit', 'Lemon', 'Mandarin', 'Saffron', 'Pink Pepper', 'Cardamom', 'Lavender', 'Jasmine', 'Mint', 'Ginger'];
const MIDDLE_NOTE_OPTIONS = ['Damask Rose', 'Oud Wood', 'Patchouli', 'Moroccan Jasmine', 'Bulgarian Rose', 'Tuberose', 'Midnight Amber', 'Cinnamon', 'Nutmeg', 'Iris', 'Orange Blossom'];
const BASE_NOTE_OPTIONS = ['Cambrian Oud', 'Sandalwood Tears', 'Siberian Musk', 'Oakmoss', 'Ambergris', 'Bourbon Vanilla', 'Fir Resin', 'Vetiver', 'Cedarwood', 'Benzoin', 'Tonka Bean'];
const PREMIUM_NOTES = ['Saffron', 'Oud Wood', 'Cambrian Oud', 'Ambergris', 'Siberian Musk', 'Damask Rose', 'Midnight Amber', 'Sandalwood Tears'];

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [profile, setProfile] = React.useState<any>(null);
  const [cart, setCart] = React.useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [selectedBrand, setSelectedBrand] = React.useState('All');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(PaymentMethod.CASH);
  const [invoiceMode, setInvoiceMode] = React.useState<'quick' | 'advanced'>('quick');
  const [loading, setLoading] = React.useState(true);
  
  // Advanced State
  const [voucherCode, setVoucherCode] = React.useState('');
  const [appliedVoucher, setAppliedVoucher] = React.useState<any>(null);
  const [discount, setDiscount] = React.useState<number>(0);
  const [discountType, setDiscountType] = React.useState<'fixed' | 'percent'>('fixed');
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = React.useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = React.useState('');
  const [customerEmailError, setCustomerEmailError] = React.useState('');
  const [receivedAmount, setReceivedAmount] = React.useState<number>(0);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [lastSale, setLastSale] = React.useState<Sale | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = React.useState(false);

  // Luxurious Perfume Configurator States
  const [configuringProduct, setConfiguringProduct] = React.useState<Product | null>(null);
  const [selectedMl, setSelectedMl] = React.useState<number>(100);
  const [selectedConcentration, setSelectedConcentration] = React.useState<string>('Eau de Parfum (EDP) (15-20%)');
  const [customEngraving, setCustomEngraving] = React.useState<string>('');

  // Scent Matchmaker States
  const [showScentMatchmaker, setShowScentMatchmaker] = React.useState(false);
  const [matchmakerLoading, setMatchmakerLoading] = React.useState(false);
  const [matchmakerError, setMatchmakerError] = React.useState<string | null>(null);
  const [prefScentFamilies, setPrefScentFamilies] = React.useState<string[]>([]);
  const [prefOccasion, setPrefOccasion] = React.useState<string>('Daily Signature');
  const [prefFavoriteNotes, setPrefFavoriteNotes] = React.useState<string>('');
  const [prefConcentration, setPrefConcentration] = React.useState<string>('Any');
  const [prefCustomPrompt, setPrefCustomPrompt] = React.useState<string>('');
  const [matchmakerResult, setMatchmakerResult] = React.useState<any | null>(null);

  // Custom Blend States
  const [showCustomBlendModal, setShowCustomBlendModal] = React.useState(false);
  const [customBlendName, setCustomBlendName] = React.useState('');
  const [customTopNotes, setCustomTopNotes] = React.useState<string[]>([]);
  const [customMiddleNotes, setCustomMiddleNotes] = React.useState<string[]>([]);
  const [customBaseNotes, setCustomBaseNotes] = React.useState<string[]>([]);
  const [customConcentration, setCustomConcentration] = React.useState<string>('Eau de Parfum (EDP) (15-20%)');
  const [customMl, setCustomMl] = React.useState<number>(100);
  const [customNoteInput, setCustomNoteInput] = React.useState('');
  const [customNoteCategory, setCustomNoteCategory] = React.useState<'top' | 'middle' | 'base'>('top');

  const handleRunMatchmaker = async () => {
    setMatchmakerLoading(true);
    setMatchmakerError(null);
    try {
      const response = await fetch('/api/scent-matchmaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            scentFamilies: prefScentFamilies,
            occasion: prefOccasion,
            favoriteNotes: prefFavoriteNotes.split(',').map(n => n.trim()).filter(Boolean),
            concentration: prefConcentration,
            customPrompt: prefCustomPrompt
          },
          products: products
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate scent recommendations.');
      }
      setMatchmakerResult(data);
    } catch (err: any) {
      console.error(err);
      setMatchmakerError(err.message || 'An error occurred during profiling.');
    } finally {
      setMatchmakerLoading(false);
    }
  };

  const handleAddBespokeFormulaToCart = (formula: any) => {
    const bespokeProductId = `BESPOKE-AI-${Date.now()}`;
    const unitPrice = 450; // Standard bespoke premium price
    const unitCost = 150;
    const finalName = `Bespoke Blend: ${formula.name}`;
    
    setCart([...cart, {
      productId: bespokeProductId,
      name: finalName,
      type: ProductType.NEW,
      quantity: 1,
      unitPrice,
      unitCost,
      totalBeforeVat: unitPrice,
      vatAmount: unitPrice * VAT_RATE,
      totalWithVat: unitPrice * (1 + VAT_RATE),
      imeiRequired: false,
      imei: [],
      selectedMl: 100,
      scentFamily: formula.ingredients.map((i: any) => i.noteName).slice(0, 3).join(" & "),
      concentration: "Bespoke Concentrated Oil (25%)"
    }]);
  };

  const calculateCustomBlendPrice = () => {
    const basePrice = 250; // Base 250 AED for 100ml EDP
    const sizeOpt = ML_OPTIONS.find(o => o.size === customMl) || ML_OPTIONS[3];
    const multiplier = sizeOpt.multiplier;
    
    let concMultiplier = 1.0;
    if (customConcentration.includes('Extrait')) concMultiplier = 1.25;
    else if (customConcentration.includes('Toilette') || customConcentration.includes('EDT')) concMultiplier = 0.85;
    else if (customConcentration.includes('Oil') || customConcentration.includes('Attar')) concMultiplier = 1.40;
    
    // Count premium notes
    const allSelectedNotes = [...customTopNotes, ...customMiddleNotes, ...customBaseNotes];
    const premiumCount = allSelectedNotes.filter(note => PREMIUM_NOTES.includes(note)).length;
    const premiumCost = premiumCount * 20 * multiplier;
    
    return Math.round((basePrice * multiplier * concMultiplier) + premiumCost);
  };

  const handleSaveFormulaToCustomer = async () => {
    if (!selectedCustomer) {
      alert("Please link/select a customer session first to save this bespoke formula to their profile.");
      return;
    }
    
    const formulaId = `FORMULA-${Date.now()}`;
    const newFormula = {
      id: formulaId,
      name: customBlendName.trim() || `Bespoke Blend #${selectedCustomer.customFormulas?.length ? selectedCustomer.customFormulas.length + 1 : 1}`,
      topNotes: customTopNotes,
      middleNotes: customMiddleNotes,
      baseNotes: customBaseNotes,
      concentration: customConcentration,
      selectedMl: customMl,
      price: calculateCustomBlendPrice(),
      createdAt: new Date().toISOString()
    };
    
    try {
      const updatedFormulas = selectedCustomer.customFormulas 
        ? [newFormula, ...selectedCustomer.customFormulas]
        : [newFormula];
        
      await customersService.update(selectedCustomer.id, {
        customFormulas: updatedFormulas
      });
      
      // Update local selected customer state to immediately reflect in the UI!
      setSelectedCustomer({
        ...selectedCustomer,
        customFormulas: updatedFormulas
      });
      
      alert(`Success: Scent profile "${newFormula.name}" recorded in database under client: ${selectedCustomer.name}`);
    } catch (err) {
      console.error("Failed to save custom formula:", err);
      alert("Error saving custom formula to profile.");
    }
  };

  const handleAddCustomBlendToCart = () => {
    const price = calculateCustomBlendPrice();
    const unitCost = Math.round(price * 0.4); // Cost estimation
    const blendId = `CUSTOM-BLEND-${Date.now()}`;
    const name = customBlendName.trim() || "Bespoke Custom Blend";
    
    const finalName = `Bespoke Blend: ${name} [${customMl}ml]`;
    const scentFamily = [...customTopNotes, ...customMiddleNotes, ...customBaseNotes].slice(0, 3).join(" & ") || "Bespoke blend";
    
    const notesString = `Top: ${customTopNotes.join(', ') || 'None'} | Mid: ${customMiddleNotes.join(', ') || 'None'} | Base: ${customBaseNotes.join(', ') || 'None'}`;
    
    setCart([...cart, {
      productId: blendId,
      name: finalName,
      type: ProductType.NEW,
      quantity: 1,
      unitPrice: price,
      unitCost,
      totalBeforeVat: price,
      vatAmount: price * VAT_RATE,
      totalWithVat: price * (1 + VAT_RATE),
      imeiRequired: false,
      imei: [notesString],
      selectedMl: customMl,
      scentFamily,
      concentration: customConcentration
    }]);
    
    // Reset and close
    setCustomBlendName('');
    setCustomTopNotes([]);
    setCustomMiddleNotes([]);
    setCustomBaseNotes([]);
    setShowCustomBlendModal(false);
  };

  const handleAddSavedFormulaToCart = (formula: any) => {
    const price = formula.price || 250;
    const unitCost = Math.round(price * 0.4);
    const blendId = `CUSTOM-BLEND-${Date.now()}`;
    
    const finalName = `Bespoke Blend: ${formula.name} [${formula.selectedMl || 100}ml]`;
    const scentFamily = [...(formula.topNotes || []), ...(formula.middleNotes || []), ...(formula.baseNotes || [])].slice(0, 3).join(" & ") || "Bespoke blend";
    
    const notesString = `Top: ${(formula.topNotes || []).join(', ') || 'None'} | Mid: ${(formula.middleNotes || []).join(', ') || 'None'} | Base: ${(formula.baseNotes || []).join(', ') || 'None'}`;
    
    setCart([...cart, {
      productId: blendId,
      name: finalName,
      type: ProductType.NEW,
      quantity: 1,
      unitPrice: price,
      unitCost,
      totalBeforeVat: price,
      vatAmount: price * VAT_RATE,
      totalWithVat: price * (1 + VAT_RATE),
      imeiRequired: false,
      imei: [notesString],
      selectedMl: formula.selectedMl || 100,
      scentFamily,
      concentration: formula.concentration || 'Eau de Parfum (EDP) (15-20%)'
    }]);
  };

  const handleLoadFormula = (formula: any) => {
    setCustomBlendName(formula.name);
    setCustomTopNotes(formula.topNotes || []);
    setCustomMiddleNotes(formula.middleNotes || []);
    setCustomBaseNotes(formula.baseNotes || []);
    setCustomConcentration(formula.concentration || 'Eau de Parfum (EDP) (15-20%)');
    setCustomMl(formula.selectedMl || 100);
  };

  const toggleNote = (note: string, category: 'top' | 'middle' | 'base') => {
    if (category === 'top') {
      setCustomTopNotes(prev => prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]);
    } else if (category === 'middle') {
      setCustomMiddleNotes(prev => prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]);
    } else {
      setCustomBaseNotes(prev => prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]);
    }
  };

  const handleNewTransaction = () => {
    setCart([]);
    setReceivedAmount(0);
    setDiscount(0);
    setVoucherCode('');
    setAppliedVoucher(null);
    setSelectedCustomer(null);
  };

  React.useEffect(() => {
     const unsubProducts = productsService.subscribe((data) => {
        setProducts(data.filter(p => p.isActive));
        setLoading(false);
     });
     const unsubCustomers = customersService.subscribe(setCustomers);
     businessProfileService.get().then(setProfile);

     return () => {
        unsubProducts();
        unsubCustomers();
     };
  }, []);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert("CRITICAL ERROR: SEQUENCE STOCK DEPLETED");
      return;
    }
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      const unitPrice = product.sellingPrice;
      const unitCost = product.costPrice;
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        type: product.type,
        quantity: 1,
        unitPrice,
        unitCost,
        totalBeforeVat: unitPrice,
        vatAmount: unitPrice * VAT_RATE,
        totalWithVat: unitPrice * (1 + VAT_RATE),
        imeiRequired: product.imeiRequired,
        imei: []
      }]);
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert("CRITICAL ERROR: SEQUENCE STOCK DEPLETED");
      return;
    }
    const isPerfume = product.category !== 'Accessories (Bottles/Boxes)' && 
                      product.category !== 'Accessories' && 
                      product.type !== ProductType.ACCESSORY;
    
    if (isPerfume) {
      // Find fallback scent profile values if missing
      const fallbacks = LUXURY_FALLBACKS[product.brand] || LUXURY_FALLBACKS['Scents & Souls'];
      const finalProduct = {
        ...product,
        scentFamily: product.scentFamily || fallbacks.scentFamily,
        concentration: product.concentration || fallbacks.concentration,
        topNotes: product.topNotes || fallbacks.topNotes,
        middleNotes: product.middleNotes || fallbacks.middleNotes,
        baseNotes: product.baseNotes || fallbacks.baseNotes
      };
      
      setConfiguringProduct(finalProduct);
      setSelectedMl(100);
      setSelectedConcentration(finalProduct.concentration || 'Eau de Parfum (EDP) (15-20%)');
      setCustomEngraving('');
    } else {
      addToCart(product);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const trimmed = barcode.trim().toLowerCase();
    const exactMatch = products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === trimmed) ||
      (p.sku && p.sku.toLowerCase() === trimmed) ||
      (p.id && p.id.toLowerCase() === trimmed)
    );
    if (exactMatch) {
      handleProductClick(exactMatch);
    } else {
      setSearchQuery(barcode);
      alert(`BARCODE NOT FOUND: No product registered with barcode "${barcode}" in the system.`);
    }
  };

  React.useEffect(() => {
    if (!searchQuery) return;
    const trimmed = searchQuery.trim().toLowerCase();
    const exactMatch = products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === trimmed) ||
      (p.sku && p.sku.toLowerCase() === trimmed) ||
      (p.id && p.id.toLowerCase() === trimmed)
    );
    if (exactMatch) {
      handleProductClick(exactMatch);
      setSearchQuery('');
    }
  }, [searchQuery, products]);

  const addConfiguredProductToCart = () => {
    if (!configuringProduct) return;
    
    const basePrice = configuringProduct.sellingPrice;
    const baseCost = configuringProduct.costPrice;
    
    const mlOpt = ML_OPTIONS.find(o => o.size === selectedMl) || ML_OPTIONS[3];
    
    let concMultiplier = 1.0;
    if (selectedConcentration.includes('Extrait')) concMultiplier = 1.25;
    else if (selectedConcentration.includes('Cologne') || selectedConcentration.includes('Toilette')) concMultiplier = 0.85;
    else if (selectedConcentration.includes('Oil') || selectedConcentration.includes('Attar')) concMultiplier = 1.40;
    
    const unitPrice = Math.round(basePrice * mlOpt.multiplier * concMultiplier);
    const unitCost = Math.round(baseCost * mlOpt.multiplier * concMultiplier);
    
    let finalName = `${configuringProduct.name.replace(/\s*(EDP|EDT|Extrait|Eau\s+de\s+Parfum|100ml|70ml|50ml|75ml)\s*/gi, '')} - ${selectedMl}ml`;
    
    let concLabel = 'EDP';
    if (selectedConcentration.includes('Extrait')) concLabel = 'Extrait';
    else if (selectedConcentration.includes('Toilette')) concLabel = 'EDT';
    else if (selectedConcentration.includes('Cologne')) concLabel = 'EDC';
    else if (selectedConcentration.includes('Oil') || selectedConcentration.includes('Attar')) concLabel = 'Attar';
    
    finalName += ` [${concLabel}]`;
    
    if (customEngraving.trim()) {
      finalName += ` {Engraved: "${customEngraving.trim()}"}`;
    }
    
    const bespokeProductId = `${configuringProduct.id}-${selectedMl}-${concLabel}-${customEngraving.trim().replace(/\s+/g, '_')}`;
    
    const existing = cart.find(i => i.productId === bespokeProductId);
    if (existing) {
      updateQuantity(bespokeProductId, existing.quantity + 1);
    } else {
      setCart([...cart, {
        productId: bespokeProductId,
        name: finalName,
        type: configuringProduct.type,
        quantity: 1,
        unitPrice,
        unitCost,
        totalBeforeVat: unitPrice,
        vatAmount: unitPrice * VAT_RATE,
        totalWithVat: unitPrice * (1 + VAT_RATE),
        imeiRequired: configuringProduct.imeiRequired,
        imei: [],
        selectedMl,
        scentFamily: configuringProduct.scentFamily,
        concentration: selectedConcentration
      }]);
    }
    
    setConfiguringProduct(null);
  };

  const updateQuantity = (productId: string, newQty: number) => {
     if (newQty < 1) return;
     const baseId = productId.split('-')[0];
     const product = products.find(p => p.id === baseId);
     if (product && newQty > product.stockQuantity) {
        alert(`STOCK LIMIT: ${product.stockQuantity} NODES AVAILABLE`);
        return;
     }

     setCart(cart.map(i => {
        if (i.productId === productId) {
           const totalBeforeVat = newQty * i.unitPrice;
           return {
              ...i,
              quantity: newQty,
              totalBeforeVat,
              vatAmount: totalBeforeVat * VAT_RATE,
              totalWithVat: totalBeforeVat * (1 + VAT_RATE)
           };
        }
        return i;
     }));
  };

  const updateIMEI = (productId: string, imeiString: string) => {
     setCart(cart.map(i => i.productId === productId ? { ...i, imei: imeiString.split(',').map(s => s.trim()).filter(s => s) } : i));
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.productId !== productId));
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.totalBeforeVat, 0);
  const vatTotal = subtotal * VAT_RATE;
  const grossTotal = subtotal + vatTotal;
  
  // Voucher logic
  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    try {
      const q = await promoVouchersService.getAll();
      const voucher = q?.find(v => v.code.toUpperCase() === voucherCode.toUpperCase() && v.isActive);
      
      if (!voucher) {
        alert("CRITICAL ERROR: INVALID CODE FRAGMENT");
        return;
      }

      const now = new Date();
      const expiry = new Date(voucher.expiryDate);
      if (now > expiry) {
        alert("CRITICAL ERROR: TEMPORAL EXPIRY REACHED");
        return;
      }

      if (subtotal < voucher.minPurchase) {
        alert(`CRITICAL ERROR: MINIMUM BASKET VALUE NOT MET. REQUIRED: ${formatCurrency(voucher.minPurchase)}`);
        return;
      }

      if (voucher.usageLimit && (voucher.usageCount || 0) >= voucher.usageLimit) {
        alert("CRITICAL ERROR: USAGE QUOTA EXHAUSTED");
        return;
      }

      setAppliedVoucher(voucher);
      setDiscount(voucher.value);
      setDiscountType(voucher.type === 'percentage' ? 'percent' : 'fixed');
      alert(`VOUCHER SYNCED: ${voucher.code} APPLIED`);
    } catch (err) {
      console.error("Voucher error:", err);
    }
  };

  const calculatedDiscount = discountType === 'fixed' ? discount : (grossTotal * discount / 100);
  const grandTotal = Math.max(0, grossTotal - calculatedDiscount);
  const changeAmount = Math.max(0, receivedAmount - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Check for required Batch Codes
    const missingIMEIs = cart.filter(item => item.imeiRequired && (!item.imei || item.imei.length < item.quantity));
    if (missingIMEIs.length > 0) {
      alert(`CRITICAL ERROR: MISSING BATCH CODE FOR [${missingIMEIs.map(i => i.name).join(', ')}]. QUALITY SECURE PROTOCOL REQUIRES BATCH CODE PER UNIT.`);
      return;
    }

    if (paymentMethod === PaymentMethod.CASH && receivedAmount < grandTotal) {
       alert("CRITICAL ERROR: INSUFFICIENT TENDERED SEQUENCE");
       return;
    }
    
    try {
       const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
       const sale: Omit<Sale, 'id'> = {
          invoiceNumber,
          customerId: selectedCustomer?.id || 'GUEST',
          customerName: selectedCustomer?.name || 'Guest Customer',
          items: cart,
          subtotal,
          vatTotal,
          discount: calculatedDiscount,
          grandTotal,
          paymentMethod,
          status: SaleStatus.COMPLETED,
          promoCode: appliedVoucher?.code,
          receivedAmount: paymentMethod === PaymentMethod.CASH ? receivedAmount : grandTotal,
          changeAmount: paymentMethod === PaymentMethod.CASH ? changeAmount : 0,
          cashierId: user?.uid || 'admin-local',
          cashierName: user?.name || 'Admin',
          createdAt: new Date().toISOString()
       };

       const saleId = await salesService.add(sale);
       
       // Update Voucher usage count
       if (appliedVoucher?.id) {
         await promoVouchersService.update(appliedVoucher.id, {
           usageCount: (appliedVoucher.usageCount || 0) + 1
         });
       }
       const finalSale = { id: saleId, ...sale } as Sale;
       setLastSale(finalSale);
       setShowReceiptModal(true);

       // Update Customer LTV
       if (selectedCustomer?.id) {
          await customersService.update(selectedCustomer.id, {
             totalSpent: (selectedCustomer.totalSpent || 0) + grandTotal,
             lastPurchaseDate: new Date().toISOString()
          });
       }

       // Create Transaction
       await transactionsService.add({
          type: AccountingType.INCOME,
          category: 'Sales',
          amount: grandTotal,
          description: `Sale - ${invoiceNumber}`,
          saleId,
          date: new Date().toISOString(),
          paymentMethod,
          reference: invoiceNumber
       });

       // Update Stock
       for (const item of cart) {
          const baseId = item.productId.split('-')[0];
          const product = products.find(p => p.id === baseId);
          if (product) {
             await productsService.update(product.id, {
                stockQuantity: Math.max(0, product.stockQuantity - item.quantity)
             });
          }
       }

       setCart([]);
       setReceivedAmount(0);
       setDiscount(0);
       setVoucherCode('');
       setAppliedVoucher(null);
       setSelectedCustomer(null);
    } catch (err) {
       console.error("Checkout error:", err);
    }
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(q) || 
                         p.sku.toLowerCase().includes(q) ||
                         p.barcode.toLowerCase().includes(q) ||
                         (p.scentFamily && p.scentFamily.toLowerCase().includes(q)) ||
                         (p.topNotes && p.topNotes.toLowerCase().includes(q)) ||
                         (p.middleNotes && p.middleNotes.toLowerCase().includes(q)) ||
                         (p.baseNotes && p.baseNotes.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    return matchesQuery && matchesCategory && matchesBrand;
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
    c.phone.includes(customerSearchQuery) ||
    c.email?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  const uniqueBrands = ['All', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];
  const uniqueCategories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const [isCartOpen, setIsCartOpen] = React.useState(false);

  const handleCheckoutRef = React.useRef(handleCheckout);
  const handleNewTransactionRef = React.useRef(handleNewTransaction);
  const cartLengthRef = React.useRef(cart.length);
  const showReceiptModalRef = React.useRef(showReceiptModal);
  const lastSaleRef = React.useRef(lastSale);

  React.useEffect(() => {
    handleCheckoutRef.current = handleCheckout;
    handleNewTransactionRef.current = handleNewTransaction;
    cartLengthRef.current = cart.length;
    showReceiptModalRef.current = showReceiptModal;
    lastSaleRef.current = lastSale;
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          handleNewTransactionRef.current();
        }
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          setShowCustomBlendModal(true);
        }
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          if (showReceiptModalRef.current) {
            window.print();
          } else if (lastSaleRef.current) {
            setShowReceiptModal(true);
            setTimeout(() => {
              window.print();
            }, 300);
          }
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          if (cartLengthRef.current > 0) {
            handleCheckoutRef.current();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full -m-4 md:-m-8 overflow-hidden bg-[#FBFBFB] relative">
      {/* Search & Products */}
      <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 md:gap-10 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} strokeWidth={2} />
            <input 
              type="text" 
              placeholder="SEARCH OR SCAN BARCODE..." 
              className="w-full pl-16 pr-16 py-4 md:py-6 bg-white border-transparent rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] focus:ring-1 focus:ring-black outline-none font-black text-[10px] md:text-xs tracking-widest placeholder:text-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowBarcodeScanner(true)}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-50 rounded-xl transition-all cursor-pointer text-gray-400 hover:text-black flex items-center justify-center"
              title="Camera Scan Barcode"
            >
              <ScanBarcode size={22} />
            </button>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button 
                onClick={() => setShowCustomerSearch(true)}
                className={cn(
                  "flex-1 md:flex-none p-4 md:p-6 rounded-2xl md:rounded-[2rem] transition-all shadow-xl group border-2 flex items-center justify-center",
                  selectedCustomer ? "bg-[#C5A059] text-white border-[#C5A059]" : "bg-white text-gray-400 border-transparent hover:border-gray-100"
                )}
             >
               <UserPlus size={20} className={cn(selectedCustomer ? "text-white" : "text-gray-300 group-hover:text-black")} />
             </button>
             <button 
                onClick={() => {
                  setShowScentMatchmaker(true);
                  if (selectedCustomer) {
                    setPrefCustomPrompt(`Resolve a bespoke perfume suggestion sequence for our client ${selectedCustomer.name}.`);
                  }
                }}
                className="flex-1 md:flex-none p-4 md:p-6 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border-2 border-[#C5A059]/30 text-[#C5A059] rounded-2xl md:rounded-[2rem] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
                title="AI Scent Matchmaker"
             >
               <Sparkles size={20} className="text-[#C5A059] group-hover:animate-pulse" />
               <span className="hidden xl:inline text-[9px] font-black tracking-widest uppercase">MATCHMAKER</span>
             </button>
             <button 
                onClick={() => setShowCustomBlendModal(true)}
                className="flex-1 md:flex-none p-4 md:p-6 bg-[#0F0F0F] hover:bg-[#C5A059] text-white border-2 border-transparent rounded-2xl md:rounded-[2rem] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
                title="Custom Scent Blend Lab [Alt+B]"
             >
               <FlaskConical size={20} className="text-[#C5A059] group-hover:rotate-12 transition-transform" />
               <span className="hidden xl:inline text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5">
                 CUSTOM BLEND
                 <kbd className="bg-[#C5A059]/20 text-[#C5A059] px-1 py-0.5 rounded text-[7px] font-mono border border-[#C5A059]/30">Alt+B</kbd>
               </span>
             </button>
             <button className="flex-1 md:flex-none p-4 md:p-6 bg-[#0F0F0F] rounded-2xl md:rounded-[2rem] text-white shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center">
               <Package size={20} />
             </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2 flex-1">
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2",
                    selectedCategory === cat 
                      ? "bg-black text-white border-black shadow-lg shadow-black/20" 
                      : "bg-white border-transparent text-gray-400 hover:text-black hover:border-gray-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* POS Keyboard Shortcuts Quick Guide */}
            <div className="flex items-center gap-3 text-[8.5px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-100 px-4 py-2.5 rounded-2xl shadow-sm self-start shrink-0">
              <span className="text-[#C5A059] flex items-center gap-1">⚡ SHORTCUTS</span>
              <div className="flex items-center gap-1 font-mono">
                <kbd className="bg-gray-100 text-black px-1.5 py-0.5 rounded border border-gray-200">ALT+N</kbd>
                <span className="text-[7.5px] opacity-75">New</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <kbd className="bg-gray-100 text-black px-1.5 py-0.5 rounded border border-gray-200">ALT+B</kbd>
                <span className="text-[7.5px] opacity-75">Blend</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <kbd className="bg-gray-100 text-black px-1.5 py-0.5 rounded border border-gray-200">ALT+S</kbd>
                <span className="text-[7.5px] opacity-75">Sync</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <kbd className="bg-gray-100 text-black px-1.5 py-0.5 rounded border border-gray-200">ALT+P</kbd>
                <span className="text-[7.5px] opacity-75">Print</span>
              </div>
            </div>
          </div>
        </div>

         <div className="flex-1 overflow-y-auto pr-2 md:pr-4 no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                disabled={product.stockQuantity <= 0}
                className="advanced-3d-card p-4 md:p-8 text-left flex flex-col gap-4 md:gap-6 group active:scale-95 transition-all relative overflow-hidden bg-white border border-transparent hover:border-gray-100"
              >
                <div className="aspect-square bg-gray-50/50 rounded-2xl md:rounded-3xl flex items-center justify-center text-gray-200 relative group-hover:scale-105 transition-transform duration-700">
                  <Package className="w-12 h-12 md:w-20 md:h-20" strokeWidth={1} />
                  {product.stockQuantity <= 0 ? (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center rounded-2xl md:rounded-3xl">
                      <span className="bg-red-500 text-white text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-[0.3em]">DEPLETED</span>
                    </div>
                  ) : product.stockQuantity <= 5 && (
                    <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-orange-500/10 text-orange-600 text-[7px] md:text-[8px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest border border-orange-100">LOW_NODE</div>
                  )}
                </div>
                <div>
                  <div className="font-black text-[11px] md:text-[13px] truncate uppercase tracking-tighter leading-tight group-hover:text-[#C5A059] transition-colors">{product.name}</div>
                  <div className="text-[8px] md:text-[10px] text-gray-300 mt-1 md:mt-2 uppercase font-black tracking-[0.2em]">{product.brand || 'GENERIC'} • {product.sku}</div>
                  
                  {product.category !== 'Accessories (Bottles/Boxes)' && product.category !== 'Accessories' && product.type !== ProductType.ACCESSORY && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[7px] px-2 py-0.5 bg-amber-50/50 text-[#C5A059] border border-amber-100/50 rounded-lg font-black uppercase tracking-widest">
                          {product.scentFamily || LUXURY_FALLBACKS[product.brand]?.scentFamily || 'Bespoke Blend'}
                        </span>
                        {product.concentration && (
                          <span className="text-[7px] px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg font-mono">
                            {product.concentration.split(' (')[0] || product.concentration}
                          </span>
                        )}
                      </div>
                      {product.topNotes && (
                        <div className="text-[7.5px] text-gray-400 font-mono leading-tight truncate mt-1">
                          <span className="font-bold text-[#C5A059] uppercase tracking-wider">Top:</span> {product.topNotes}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-50">
                     <div className="text-sm md:text-xl font-black font-display tracking-tighter">
                       {formatCurrency(product.sellingPrice)}
                     </div>
                     <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all">
                        <Plus size={14} strokeWidth={3} />
                     </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cart Trigger for Mobile */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden w-16 h-16 bg-[#0F0F0F] text-white rounded-full shadow-2xl z-[40] flex items-center justify-center group"
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#C5A059] rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-white animate-bounce-short">
              {cart.length}
            </span>
          )}
        </div>
      </motion.button>

      {/* Slide-In Checkout Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-[60] lg:relative lg:inset-auto lg:z-20",
        "w-[320px] xs:w-[400px] sm:w-[500px] lg:w-[500px] bg-white border-l border-gray-100 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-spring",
        isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Close Handle */}
        <button 
          onClick={() => setIsCartOpen(false)}
          className="lg:hidden absolute -left-12 top-6 w-12 h-12 bg-white rounded-l-2xl border-l border-t border-b border-gray-100 flex items-center justify-center text-gray-400"
        >
          <X size={20} />
        </button>

        <div className="p-6 md:p-10 border-b border-gray-50 bg-white sticky top-0 z-10">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-black/20">
                  <ShoppingCart size={22} className="md:w-[28px] md:h-[28px]" />
                </div>
                <div>
                  <h2 className="font-black font-display text-xl md:text-3xl tracking-tighter uppercase leading-none">ORDER_SYNC</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">NODE_01</span>
                     </div>
                     <span className="text-[8px] md:text-[10px] font-black text-[#C5A059] uppercase tracking-[0.2em] truncate max-w-[150px]">
                        {selectedCustomer ? selectedCustomer.name : 'Guest Session'}
                     </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleNewTransaction}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl md:rounded-2xl transition-all group/trash relative animate-pulse-short"
                title="New Transaction / Clear Cart [Alt+N]"
              >
                <Trash2 size={20} md:size={24} />
                <span className="absolute -bottom-1 right-1/2 translate-x-1/2 translate-y-full bg-black text-white text-[7.5px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover/trash:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">Alt+N</span>
              </button>
           </div>

           <div className="mt-6 md:mt-10 flex items-center gap-2 bg-gray-50 p-1 rounded-xl md:rounded-2xl border border-gray-100">
             <button 
                onClick={() => setInvoiceMode('quick')}
                className={cn(
                  "flex-1 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-lg md:rounded-xl transition-all",
                  invoiceMode === 'quick' ? "bg-white text-black shadow-md md:shadow-lg" : "text-gray-400"
                )}
             >
               Express
             </button>
             <button 
                onClick={() => setInvoiceMode('advanced')}
                className={cn(
                  "flex-1 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-lg md:rounded-xl transition-all",
                  invoiceMode === 'advanced' ? "bg-white text-black shadow-md md:shadow-lg" : "text-gray-400"
                )}
             >
               Architect
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-200 gap-6 md:gap-8 opacity-20">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center">
                  <ShoppingCart size={48} md:size={64} strokeWidth={1} />
               </div>
               <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] md:tracking-[0.8em] text-center">Standby Sequence</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div 
                key={item.productId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4 md:gap-6 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all group relative"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">
                  <Package size={20} md:size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] md:text-[13px] font-black uppercase tracking-tight truncate flex items-center gap-2 md:gap-3">
                    {item.name}
                    {(invoiceMode === 'advanced' || item.imeiRequired) && (
                       <span className={cn(
                         "text-[7px] md:text-[8px] px-1.5 md:px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                         item.type === ProductType.USED ? "bg-blue-600 text-white" : "bg-green-600 text-white"
                       )}>
                         {item.type}
                       </span>
                    )}
                  </div>
                  <div className="text-[8px] md:text-[9px] text-gray-300 mt-1 uppercase font-black tracking-widest flex items-center justify-between">
                    <span>{formatCurrency(item.unitPrice)}</span>
                    <span className="text-[#C5A059] font-bold">Tax: {formatCurrency(item.vatAmount)}</span>
                  </div>
                  
                  {item.productId.startsWith('CUSTOM-BLEND') && item.imei && item.imei.length > 0 && (
                    <div className="mt-2 text-[8.5px] text-[#C5A059] font-mono leading-relaxed bg-[#C5A059]/5 border border-[#C5A059]/20 p-2 rounded-xl">
                      <span className="font-bold uppercase tracking-wider block mb-0.5">Custom Scent Formula:</span>
                      {item.imei[0]}
                    </div>
                  )}
                  
                  {(invoiceMode === 'advanced' || item.imeiRequired) && (
                    <div className="mt-3 md:mt-4">
                       <input 
                         type="text" 
                         placeholder={item.imeiRequired ? "ENTER BATCH CODE(S) / LOT NO. ..." : "OPTIONAL NOTES / VOL ..."}
                         value={item.imei?.join(', ')}
                         onChange={(e) => updateIMEI(item.productId, e.target.value)}
                         className={cn(
                           "w-full text-[8px] md:text-[9px] px-3 md:px-4 py-2 md:py-3 bg-white border border-gray-100 rounded-lg md:rounded-xl focus:border-black outline-none font-mono font-bold placeholder:text-gray-200",
                           item.imeiRequired && (!item.imei || item.imei.length < item.quantity) ? "border-orange-200 bg-orange-50/30" : ""
                         )}
                       />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 md:mt-5">
                    <div className="flex items-center gap-3 md:gap-4 bg-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-gray-100 shadow-sm">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="text-gray-300 hover:text-black transition-colors"><Minus size={12} md:size={14} /></button>
                      <span className="text-[10px] md:text-xs font-black min-w-[1ch] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="text-black transition-colors"><Plus size={12} md:size={14} strokeWidth={3} /></button>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                   <div className="text-[10px] md:text-[13px] font-black font-display tracking-tight bg-black text-white px-3 md:px-4 py-1.5 md:py-2 rounded-[0.8rem] md:rounded-[1rem] shadow-lg shadow-black/20">
                     {formatCurrency(item.totalWithVat)}
                   </div>
                   <button onClick={() => removeFromCart(item.productId)} className="p-2 text-gray-200 hover:text-red-500 transition-colors">
                      <Trash2 size={16} md:size={20} />
                   </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-6 md:p-10 bg-gray-50/50 backdrop-blur-3xl border-t border-gray-100 space-y-6 md:space-y-10">
          <div className="space-y-3 md:space-y-4">
             <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span>Subtotal</span>
                <span className="text-black">{formatCurrency(subtotal)}</span>
             </div>
             <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span>VAT (5%)</span>
                <span className="text-black">{formatCurrency(vatTotal)}</span>
             </div>
             
             <div className="pt-4 md:pt-6 border-t-2 border-dashed border-gray-200 space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">TOTAL</span>
                   </div>
                   <div className="text-3xl md:text-5xl font-black font-display tracking-tighter text-[#C5A059]">
                      {formatCurrency(grandTotal)}
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button 
              onClick={() => setPaymentMethod(PaymentMethod.CASH)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 transition-all",
                paymentMethod === PaymentMethod.CASH ? "bg-[#0F0F0F] text-white border-transparent shadow-xl" : "bg-white text-gray-400 border-transparent"
              )}
            >
              <Banknote size={20} md:size={22} className={cn(paymentMethod === PaymentMethod.CASH ? "text-[#C5A059]" : "text-gray-200")} />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Cash</span>
            </button>
            <button 
              onClick={() => setPaymentMethod(PaymentMethod.CARD)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 transition-all",
                paymentMethod === PaymentMethod.CARD ? "bg-[#0F0F0F] text-white border-transparent shadow-xl" : "bg-white text-gray-400 border-transparent"
              )}
            >
              <CreditCard size={20} md:size={22} className={cn(paymentMethod === PaymentMethod.CARD ? "text-[#C5A059]" : "text-gray-200")} />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Card</span>
            </button>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-[#0F0F0F] text-white py-6 md:py-8 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-sm flex items-center justify-center gap-4 md:gap-6 active:scale-95 transition-all disabled:opacity-30 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
          >
            <Receipt size={18} md:size={24} strokeWidth={2.5} />
            SYNC TRANSACTION
          </button>
        </div>
      </div>

      {/* Mobile Cart Overlay Backdrop */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Luxurious 3D Perfume Configurator & Lab Modal */}
      <AnimatePresence>
        {configuringProduct && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setConfiguringProduct(null)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            
            {/* Embedded styles for the beautiful fluid animations */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes luxuryWave {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              @keyframes luxuryBubbleUp {
                0% { transform: translateY(40px) scale(0.8); opacity: 0; }
                50% { opacity: 0.6; }
                100% { transform: translateY(-200px) scale(1.2); opacity: 0; }
              }
              .animate-wave-slow {
                animation: luxuryWave 8s linear infinite;
              }
              .animate-wave-fast {
                animation: luxuryWave 5s linear infinite;
              }
              .animate-bubble-1 {
                animation: luxuryBubbleUp 4s ease-in-out infinite;
              }
              .animate-bubble-2 {
                animation: luxuryBubbleUp 5s ease-in-out infinite 1.5s;
              }
              .animate-bubble-3 {
                animation: luxuryBubbleUp 3s ease-in-out infinite 0.5s;
              }
              .font-cursive {
                font-family: 'Playfair Display', 'Georgia', serif;
              }
            `}} />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 30 }} 
              className="relative w-full max-w-5xl bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 max-h-[92vh] overflow-y-auto no-scrollbar border border-gray-100"
            >
              {/* Left Column: Interactive 3D Perfume Bottle Preview (Lazy Loaded & Object Pooled) */}
              <React.Suspense fallback={
                <div className="lg:col-span-5 flex flex-col items-center justify-center bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 min-h-[460px] relative overflow-hidden">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-gray-400" size={32} />
                    <p className="text-[10px] font-mono font-black uppercase tracking-widest text-gray-400">Loading Luxury 3D Viewer...</p>
                  </div>
                </div>
              }>
                <PerfumeViewer3D
                  configuringProduct={configuringProduct}
                  selectedMl={selectedMl}
                  selectedConcentration={selectedConcentration}
                  customEngraving={customEngraving}
                  LUXURY_FALLBACKS={LUXURY_FALLBACKS}
                  ML_OPTIONS={ML_OPTIONS}
                />
              </React.Suspense>

              {/* Right Column: Interactive Bespoke Formula Options */}
              <div className="lg:col-span-7 flex flex-col gap-6 md:gap-8 justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] md:text-[9px] px-2.5 py-1 bg-amber-50 text-[#C5A059] border border-amber-100 rounded-lg font-black uppercase tracking-[0.2em]">
                      {configuringProduct.brand || 'BESPOKE LAB'}
                    </span>
                    <h2 className="font-display text-2xl md:text-3.5xl font-black uppercase tracking-tighter mt-3 leading-tight">
                      {configuringProduct.name.replace(/\s*(EDP|EDT|Extrait|Eau\s+de\s+Parfum|100ml|70ml|50ml|75ml)/gi, '')}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] mt-2">
                      Molecular Scent Profiler • {configuringProduct.sku}
                    </p>
                  </div>
                  <button 
                    onClick={() => setConfiguringProduct(null)} 
                    className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-black transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scent Wise Pyramids (Notes) */}
                <div className="bg-gray-50/40 p-5 rounded-3xl border border-gray-100 flex flex-col gap-3">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full" />
                    Olfactory pyramid formulation
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-2xl border border-gray-100 flex flex-col gap-1">
                      <span className="text-[7.5px] font-black uppercase text-[#C5A059] tracking-widest bg-amber-50 px-1.5 py-0.5 rounded w-fit">Top Notes</span>
                      <p className="text-[9px] text-gray-600 font-bold leading-tight mt-1">{configuringProduct.topNotes}</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-gray-100 flex flex-col gap-1">
                      <span className="text-[7.5px] font-black uppercase text-purple-600 tracking-widest bg-purple-50 px-1.5 py-0.5 rounded w-fit">Heart Notes</span>
                      <p className="text-[9px] text-gray-600 font-bold leading-tight mt-1">{configuringProduct.middleNotes}</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-gray-100 flex flex-col gap-1">
                      <span className="text-[7.5px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-1.5 py-0.5 rounded w-fit">Base Notes</span>
                      <p className="text-[9px] text-gray-600 font-bold leading-tight mt-1">{configuringProduct.baseNotes}</p>
                    </div>
                  </div>
                </div>

                {/* Sizing (ML) Choice */}
                <div className="space-y-3">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center justify-between">
                    <span>SELECT VESSEL VOLUME (ML)</span>
                    <span className="text-black font-black">Pro-Rated Calibration</span>
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {ML_OPTIONS.map(opt => {
                      const isSelected = selectedMl === opt.size;
                      return (
                        <button
                          type="button"
                          key={opt.size}
                          onClick={() => setSelectedMl(opt.size)}
                          className={cn(
                            "p-3 rounded-2xl text-center border transition-all flex flex-col items-center justify-center gap-1 group active:scale-95",
                            isSelected 
                              ? "bg-black border-black text-white shadow-lg" 
                              : "bg-white hover:bg-gray-50 border-gray-100 text-gray-400 hover:text-black"
                          )}
                        >
                          <span className="text-[12px] md:text-[14px] font-black">{opt.size}</span>
                          <span className="text-[6.5px] font-black uppercase tracking-widest leading-none opacity-60">ML</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Concentration Selector */}
                <div className="space-y-3">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    CONCENTRATION ACCORD & RESOLUTION
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { name: 'Eau de Toilette (EDT) (10-15%)', label: 'EDT', multiplier: 'x0.85', desc: 'Lighter Fresh' },
                      { name: 'Eau de Parfum (EDP) (15-20%)', label: 'EDP', multiplier: 'x1.00', desc: 'Signature' },
                      { name: 'Extrait de Parfum (25-40%)', label: 'Extrait', multiplier: 'x1.25', desc: 'Bespoke Oil' },
                      { name: 'Concentrated Attar Oil (100%)', label: 'Attar', multiplier: 'x1.40', desc: 'Pure Extract' }
                    ].map(conc => {
                      const isSelected = selectedConcentration === conc.name;
                      return (
                        <button
                          type="button"
                          key={conc.name}
                          onClick={() => setSelectedConcentration(conc.name)}
                          className={cn(
                            "p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95",
                            isSelected 
                              ? "bg-amber-50 border-[#C5A059] text-black shadow-sm shadow-[#C5A059]/10" 
                              : "bg-white hover:bg-gray-50 border-gray-100 text-gray-400 hover:text-black"
                          )}
                        >
                          <div>
                            <div className={cn("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-[#C5A059]" : "text-gray-900")}>{conc.label}</div>
                            <div className="text-[7px] text-gray-400 font-bold mt-0.5 uppercase leading-tight">{conc.desc}</div>
                          </div>
                          <div className="text-[8px] font-mono font-black mt-2 text-right opacity-80">{conc.multiplier}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Laser Engraving Input */}
                <div className="space-y-3">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    BESPOKE GOLD-PLAQUE ENGRAVING (OPTIONAL)
                  </h3>
                  <input
                    type="text"
                    maxLength={24}
                    placeholder="ENTER ENGRAVING TEXT (E.G. SPECIALLY BOTTLED FOR JIN)..."
                    value={customEngraving}
                    onChange={(e) => setCustomEngraving(e.target.value.toUpperCase())}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#C5A059] focus:bg-white outline-none font-mono font-black text-[9px] md:text-[10px] tracking-widest placeholder:text-gray-300"
                  />
                </div>

                {/* Pricing summary & ADD */}
                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                  <div className="text-left w-full sm:w-auto">
                    <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Bespoke Dispensation Price</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl md:text-3.5xl font-black font-display tracking-tighter text-[#C5A059]">
                        {formatCurrency(
                          Math.round(
                            configuringProduct.sellingPrice * 
                            (ML_OPTIONS.find(o => o.size === selectedMl)?.multiplier || 1.0) *
                            (selectedConcentration.includes('Extrait') ? 1.25 : selectedConcentration.includes('Toilette') ? 0.85 : selectedConcentration.includes('Oil') ? 1.40 : 1.0)
                          )
                        )}
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Incl. 5% VAT</span>
                    </div>
                  </div>

                  <button
                    onClick={addConfiguredProductToCart}
                    className="w-full sm:w-auto px-10 py-5 bg-[#0F0F0F] text-white hover:bg-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-black/15"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Infuse & Dispense to Order
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Scent Matchmaker Modal */}
      <AnimatePresence>
        {showScentMatchmaker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowScentMatchmaker(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden p-8 md:p-12 flex flex-col max-h-[90vh] border border-gray-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <Sparkles className="text-[#C5A059] animate-pulse" size={28} />
                    AI_SCENT_MATCHMAKER
                  </h2>
                  <p className="text-[10px] text-[#C5A059] font-black uppercase tracking-[0.3em] mt-2">
                    RESOLVE BESPOKE SCENT SEQUENCES AND RECOMMENDATIONS VIA GEMINI AI
                  </p>
                </div>
                <button onClick={() => setShowScentMatchmaker(false)} className="w-12 h-12 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 hover:text-black transition-all">
                  <X size={24} />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden flex-1 min-h-0">
                {/* Left side: Inputs */}
                <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
                  {/* Selected Client Context */}
                  {selectedCustomer && (
                    <div className="p-4 bg-[#C5A059]/5 border border-[#C5A059]/20 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase text-[#C5A059] tracking-widest">ACTIVE CLIENT LINKED</p>
                        <p className="font-bold text-xs uppercase text-gray-800 mt-1">{selectedCustomer.name}</p>
                      </div>
                      <span className="text-[8px] bg-[#C5A059] text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider">SYNC_READY</span>
                    </div>
                  )}

                  {/* Custom Description Textarea */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">CUSTOM PROFILE DESCRIPTION / REQUEST</label>
                    <textarea 
                      rows={3}
                      placeholder="e.g. A client looking for a deep, warm, mysterious oud scent with vanilla and spicy cardamom for signature evening events in Dubai..."
                      className="w-full p-4 bg-gray-50 border border-transparent hover:border-gray-100 focus:border-black/20 focus:bg-white rounded-xl text-xs outline-none transition-all resize-none leading-relaxed"
                      value={prefCustomPrompt}
                      onChange={e => setPrefCustomPrompt(e.target.value)}
                    />
                  </div>

                  {/* Scent Family Multi-select */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2.5">TARGET SCENT FAMILIES</label>
                    <div className="flex flex-wrap gap-2">
                      {['Woody', 'Floral', 'Oud & Oriental', 'Citrus & Fresh', 'Musk & Amber', 'Warm Spicy', 'Leather', 'Sweet'].map(family => {
                        const isSelected = prefScentFamilies.includes(family);
                        return (
                          <button
                            key={family}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setPrefScentFamilies(prefScentFamilies.filter(f => f !== family));
                              } else {
                                setPrefScentFamilies([...prefScentFamilies, family]);
                              }
                            }}
                            className={cn(
                              "px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border",
                              isSelected 
                                ? "bg-black text-white border-black" 
                                : "bg-gray-50 border-transparent text-gray-400 hover:text-black hover:bg-gray-100"
                            )}
                          >
                            {family}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Occasion / Mood */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">OCCASION / MOOD SEQUENCE</label>
                    <select
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-xl text-xs outline-none focus:bg-white focus:border-black/20 font-bold uppercase tracking-wider"
                      value={prefOccasion}
                      onChange={e => setPrefOccasion(e.target.value)}
                    >
                      <option value="Daily Signature">Daily Signature / Office</option>
                      <option value="Luxury Evening Gala">Luxury Evening / Gala Event</option>
                      <option value="Sultry Date Night">Sultry / Date Night</option>
                      <option value="Fresh Summer Radiance">Summer Fresh / Daytime Beach</option>
                      <option value="Cozy Winter Warmth">Winter Cozy / Fireplace</option>
                      <option value="Bespoke Royalty">Royal Signature / Majestic Presence</option>
                    </select>
                  </div>

                  {/* Target Notes */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">PREFERRED SCENT NOTES (COMMA-SEPARATED)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Oud, Rose, Patchouli, Bergamot, Cardamom"
                      className="w-full p-4 bg-gray-50 border border-transparent hover:border-gray-100 focus:border-black/20 focus:bg-white rounded-xl text-xs outline-none font-bold uppercase tracking-wider placeholder:normal-case placeholder:font-normal"
                      value={prefFavoriteNotes}
                      onChange={e => setPrefFavoriteNotes(e.target.value)}
                    />
                  </div>

                  {/* Target Concentration */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">CONCENTRATION PARAMETER</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Any', 'EDT', 'EDP', 'Extrait'].map(conc => (
                        <button
                          key={conc}
                          type="button"
                          onClick={() => setPrefConcentration(conc)}
                          className={cn(
                            "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                            prefConcentration === conc 
                              ? "bg-black text-white border-black" 
                              : "bg-gray-50 border-transparent text-gray-400 hover:text-black hover:bg-gray-100"
                          )}
                        >
                          {conc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Match Trigger Button */}
                  <button
                    type="button"
                    onClick={handleRunMatchmaker}
                    disabled={matchmakerLoading}
                    className="mt-4 w-full py-5 bg-[#C5A059] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-[#C5A059]/10 disabled:opacity-50"
                  >
                    {matchmakerLoading ? "COMPUTING OLFACTORY MATRIX..." : "RUN MATCHMAKER SEQUENCE"}
                  </button>
                </div>

                {/* Right side: AI suggestions & Bespoke recipe output */}
                <div className="lg:col-span-7 flex flex-col overflow-y-auto pl-2 pr-1 bg-gray-50/50 rounded-3xl p-6 md:p-8 border border-gray-100/50 relative no-scrollbar">
                  {matchmakerLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                      <div className="w-16 h-16 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-6" />
                      <h4 className="font-display font-black text-lg uppercase tracking-tight text-gray-800 animate-pulse">
                        DISTILLING SCENT CHORDS...
                      </h4>
                      <p className="text-[9px] text-[#C5A059] font-black uppercase tracking-[0.25em] mt-3">
                        Consulting master nose and aligning inventory formulas
                      </p>
                      
                      <div className="mt-8 space-y-2 max-w-sm">
                        <p className="text-[10px] text-gray-400 font-mono italic animate-pulse">"Blending base notes of rare Cambodian Oud..."</p>
                        <p className="text-[10px] text-gray-400 font-mono italic animation-delay-1000 animate-pulse">"Calculating match vectors with our luxury catalog..."</p>
                      </div>
                    </div>
                  ) : matchmakerError ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <X size={24} />
                      </div>
                      <h4 className="font-black text-sm uppercase text-red-500 tracking-wider">RESOLVING SEQUENCE FAILED</h4>
                      <p className="text-xs text-gray-500 mt-2 max-w-md leading-relaxed">{matchmakerError}</p>
                      <button
                        type="button"
                        onClick={handleRunMatchmaker}
                        className="mt-6 px-6 py-3 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all"
                      >
                        RETRY SEQUENCING
                      </button>
                    </div>
                  ) : matchmakerResult ? (
                    <div className="space-y-8 flex-1">
                      {/* Product Suggestions */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                          <Package size={14} className="text-[#C5A059]" />
                          MATCHED CATALOG FRAGRANCES ({matchmakerResult.recommendations?.length || 0})
                        </h4>
                        
                        {(!matchmakerResult.recommendations || matchmakerResult.recommendations.length === 0) ? (
                          <p className="text-xs text-gray-400 italic">No exact catalog products match these specific preferences. Consider our bespoke blend formulation below!</p>
                        ) : (
                          <div className="space-y-4">
                            {matchmakerResult.recommendations.map((rec: any, idx: number) => {
                              const matchProduct = products.find(p => p.id === rec.productId);
                              return (
                                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      {matchProduct ? (
                                        <>
                                          <p className="text-[8px] font-black text-[#C5A059] uppercase tracking-wider">{matchProduct.brand}</p>
                                          <h5 className="font-bold text-sm text-gray-800 uppercase mt-0.5">{matchProduct.name}</h5>
                                          <p className="text-[9px] text-gray-400 uppercase font-mono tracking-wider mt-1">Scent Family: {matchProduct.scentFamily || 'Bespoke'}</p>
                                        </>
                                      ) : (
                                        <>
                                          <p className="text-[8px] font-black text-[#C5A059] uppercase tracking-wider">SCENT MATCH</p>
                                          <h5 className="font-bold text-sm text-gray-400 italic uppercase mt-0.5">Product ID: {rec.productId} (Not in active list)</h5>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                      <span className="text-xs font-black text-[#C5A059] font-mono">{rec.matchPercentage}% MATCH</span>
                                      <div className="w-20 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                        <div className="h-full bg-[#C5A059] rounded-full" style={{ width: `${rec.matchPercentage}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <p className="text-[11px] text-gray-500 leading-relaxed italic border-l-2 border-gray-100 pl-4">
                                    "{rec.whyItMatches}"
                                  </p>
                                  
                                  {rec.layeringAdvice && (
                                    <div className="bg-[#C5A059]/5 p-3 rounded-xl border border-[#C5A059]/10 text-[10px] text-gray-600">
                                      <strong className="text-[#A07040] uppercase font-black tracking-wider block mb-1">Layering Protocol</strong>
                                      {rec.layeringAdvice}
                                    </div>
                                  )}
                                  
                                  {matchProduct && (
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                                      <span className="text-xs font-black uppercase text-gray-700">{formatCurrency(matchProduct.sellingPrice)}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleProductClick(matchProduct);
                                        }}
                                        className="px-4 py-2 bg-black hover:bg-[#C5A059] text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all"
                                      >
                                        + CONFIGURE & ADD TO SEQUENCE
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Bespoke LAB Formula Suggestion */}
                      {matchmakerResult.bespokeFormula && (
                        <div className="bg-white p-8 rounded-3xl border border-[#C5A059]/20 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-[#C5A059]/10 text-[#C5A059] text-[8px] font-black uppercase px-4 py-1.5 rounded-bl-2xl tracking-widest">
                            LAB_BESPOKE_FORMULA
                          </div>
                          
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white shrink-0">
                              <FlaskConical size={18} />
                            </div>
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-widest text-[#C5A059]">Bespoke Blended Formulation</p>
                              <h5 className="font-display font-black text-base uppercase text-gray-800 tracking-tight">{matchmakerResult.bespokeFormula.name}</h5>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 leading-relaxed mb-6 italic">{matchmakerResult.bespokeFormula.description}</p>
                          
                          {/* Recipe breakdown */}
                          <div className="mb-6">
                            <h6 className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-3">OIL PERCENTAGE ALLOCATION (100% CONCENTRATE)</h6>
                            <div className="space-y-3">
                              {matchmakerResult.bespokeFormula.ingredients?.map((ing: any, i: number) => (
                                <div key={i} className="flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between text-[10px] text-gray-700">
                                    <span className="font-bold uppercase tracking-wider">{ing.noteName} <span className="text-[8px] text-gray-400 font-normal">({ing.role})</span></span>
                                    <span className="font-mono font-black">{ing.percentage}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full",
                                        ing.role?.toLowerCase().includes("base") ? "bg-black" : ing.role?.toLowerCase().includes("middle") ? "bg-[#C5A059]" : "bg-gray-300"
                                      )} 
                                      style={{ width: `${ing.percentage}%` }} 
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {matchmakerResult.bespokeFormula.careRitual && (
                            <div className="p-4 bg-gray-50 rounded-2xl text-[10px] text-gray-500 leading-relaxed mb-6 border border-gray-100">
                              <strong className="text-gray-700 uppercase font-black tracking-wider block mb-1">Olfactory Care Ritual</strong>
                              {matchmakerResult.bespokeFormula.careRitual}
                            </div>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => handleAddBespokeFormulaToCart(matchmakerResult.bespokeFormula)}
                            className="w-full py-4 bg-black hover:bg-[#C5A059] text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
                          >
                            + ADD BESPOKE BLEND TO TRANSACTION (100ml / AED 450)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                      <div className="w-12 h-12 bg-[#C5A059]/10 text-[#C5A059] rounded-full flex items-center justify-center mb-4">
                        <Sparkles size={24} />
                      </div>
                      <h4 className="font-display font-black text-sm uppercase text-gray-400 tracking-widest">AWAITING INPUT PROFILE</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest max-w-xs mt-2 leading-relaxed">
                        Specify client notes, preferences, or desires on the left to resolve recommendation sequences
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Blend Lab Modal */}
      <AnimatePresence>
        {showCustomBlendModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCustomBlendModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 30 }} 
              className="relative w-full max-w-6xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden p-8 md:p-12 flex flex-col max-h-[92vh] border border-gray-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6 shrink-0">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <FlaskConical className="text-[#C5A059] animate-bounce-short" size={28} />
                    CUSTOM_BLEND_LAB
                  </h2>
                  <p className="text-[10px] text-[#C5A059] font-black uppercase tracking-[0.3em] mt-2">
                    CALIBRATE CUSTOM PERFUME FORMULAS, CALCULATE BESPOKE PRICING, AND STORE RECORDS
                  </p>
                </div>
                <button onClick={() => setShowCustomBlendModal(false)} className="w-12 h-12 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 hover:text-black transition-all">
                  <X size={24} />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden flex-1 min-h-0">
                
                {/* Left Column: Creator inputs (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-3 no-scrollbar">
                  {/* Scent Name Input */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Formula Name / Scent Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Amber Dream, Royal Oud Intense, Desert Breeze..."
                      value={customBlendName}
                      onChange={e => setCustomBlendName(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-black outline-none font-bold placeholder:text-gray-300 text-sm"
                    />
                  </div>

                  {/* Volume Selector */}
                  <div className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Vessel Volume (ML)</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {ML_OPTIONS.map(opt => {
                        const isSelected = customMl === opt.size;
                        return (
                          <button
                            type="button"
                            key={opt.size}
                            onClick={() => setCustomMl(opt.size)}
                            className={cn(
                              "p-3 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1 active:scale-95",
                              isSelected 
                                ? "bg-black border-black text-white shadow-lg" 
                                : "bg-white hover:bg-gray-50 border-gray-100 text-gray-400 hover:text-black"
                            )}
                          >
                            <span className="text-sm font-black">{opt.size}</span>
                            <span className="text-[6.5px] font-black uppercase tracking-widest leading-none opacity-60">ML</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Concentration Selector */}
                  <div className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Concentration Accord</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { name: 'Eau de Toilette (EDT) (10-15%)', label: 'EDT', multiplier: 'x0.85' },
                        { name: 'Eau de Parfum (EDP) (15-20%)', label: 'EDP', multiplier: 'x1.00' },
                        { name: 'Extrait de Parfum (25-40%)', label: 'Extrait', multiplier: 'x1.25' },
                        { name: 'Concentrated Perfume Oil (100%)', label: 'Pure Oil', multiplier: 'x1.40' }
                      ].map(conc => {
                        const isSelected = customConcentration === conc.name;
                        return (
                          <button
                            type="button"
                            key={conc.name}
                            onClick={() => setCustomConcentration(conc.name)}
                            className={cn(
                              "p-3 rounded-xl border text-left flex flex-col justify-between transition active:scale-95 h-20",
                              isSelected 
                                ? "bg-black border-black text-white shadow-lg" 
                                : "bg-white hover:bg-gray-50 border-gray-100 text-gray-400 hover:text-black"
                            )}
                          >
                            <span className="text-[9px] font-black tracking-widest">{conc.label}</span>
                            <span className="text-[7.5px] font-black uppercase tracking-wider opacity-60 leading-tight mt-1">{conc.name.split('(')[1]?.replace(')', '') || conc.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Note Category Selection tab */}
                  <div className="space-y-4">
                    <div className="flex border-b border-gray-100">
                      {[
                        { key: 'top', label: 'Top Notes' },
                        { key: 'middle', label: 'Heart Notes' },
                        { key: 'base', label: 'Base Notes' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setCustomNoteCategory(tab.key as any)}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                            customNoteCategory === tab.key 
                              ? "border-black text-black font-black" 
                              : "border-transparent text-gray-400 hover:text-black"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Quick chips selection */}
                    <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase text-gray-400 tracking-wider">SELECT TO INFUSE (PREMIUM NOTES SHOWN WITH +20 AED SURCHARGE):</p>
                      <div className="flex flex-wrap gap-2">
                        {(customNoteCategory === 'top' ? TOP_NOTE_OPTIONS : customNoteCategory === 'middle' ? MIDDLE_NOTE_OPTIONS : BASE_NOTE_OPTIONS).map(note => {
                          const isSelected = (customNoteCategory === 'top' ? customTopNotes : customNoteCategory === 'middle' ? customMiddleNotes : customBaseNotes).includes(note);
                          const isPremium = PREMIUM_NOTES.includes(note);
                          return (
                            <button
                              key={note}
                              type="button"
                              onClick={() => toggleNote(note, customNoteCategory)}
                              className={cn(
                                "px-3.5 py-2 rounded-xl text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 border active:scale-95",
                                isSelected 
                                  ? "bg-black text-white border-black" 
                                  : isPremium 
                                    ? "bg-amber-50 text-[#C5A059] border-amber-100 hover:border-[#C5A059]" 
                                    : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300"
                              )}
                            >
                              {note}
                              {isPremium && (
                                <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full shrink-0", isSelected ? "bg-amber-500 text-black" : "bg-amber-100 text-[#C5A059]")}>
                                  +20
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom note tag input */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={`ADD CUSTOM ${customNoteCategory.toUpperCase()} NOTE (e.g. White Truffle, Desert Sand)...`}
                        value={customNoteInput}
                        onChange={e => setCustomNoteInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const noteName = customNoteInput.trim();
                            if (!noteName) return;
                            if (customNoteCategory === 'top') {
                              if (!customTopNotes.includes(noteName)) setCustomTopNotes([...customTopNotes, noteName]);
                            } else if (customNoteCategory === 'middle') {
                              if (!customMiddleNotes.includes(noteName)) setCustomMiddleNotes([...customMiddleNotes, noteName]);
                            } else {
                              if (!customBaseNotes.includes(noteName)) setCustomBaseNotes([...customBaseNotes, noteName]);
                            }
                            setCustomNoteInput('');
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-black outline-none font-bold text-[10px] placeholder:text-gray-300 uppercase tracking-wider"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const noteName = customNoteInput.trim();
                          if (!noteName) return;
                          if (customNoteCategory === 'top') {
                            if (!customTopNotes.includes(noteName)) setCustomTopNotes([...customTopNotes, noteName]);
                          } else if (customNoteCategory === 'middle') {
                            if (!customMiddleNotes.includes(noteName)) setCustomMiddleNotes([...customMiddleNotes, noteName]);
                          } else {
                            if (!customBaseNotes.includes(noteName)) setCustomBaseNotes([...customBaseNotes, noteName]);
                          }
                          setCustomNoteInput('');
                        }}
                        className="px-6 py-3 bg-black hover:bg-black/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center"
                      >
                        INFUSE Note
                      </button>
                    </div>
                  </div>

                  {/* Chosen formula overview */}
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Active Formulation Blueprint</p>
                    <div className="space-y-2">
                      <div className="text-[10px]"><strong className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase font-black text-[7.5px] tracking-wider mr-2">Top Layers:</strong> {customTopNotes.join(', ') || <span className="text-gray-300 italic">No top layers selected</span>}</div>
                      <div className="text-[10px]"><strong className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase font-black text-[7.5px] tracking-wider mr-2">Heart Layers:</strong> {customMiddleNotes.join(', ') || <span className="text-gray-300 italic">No heart layers selected</span>}</div>
                      <div className="text-[10px]"><strong className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase font-black text-[7.5px] tracking-wider mr-2">Base Layers:</strong> {customBaseNotes.join(', ') || <span className="text-gray-300 italic">No base layers selected</span>}</div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Calculations & Customer Formula Records (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pl-3 no-scrollbar border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0">
                  {/* Pricing Calibration Card */}
                  <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl space-y-4">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#C5A059]">CALIBRATED PRICING MATRIX</p>
                    
                    <div className="space-y-2 text-[10px] text-gray-500 font-bold">
                      <div className="flex justify-between">
                        <span>Base Price (100ml EDP)</span>
                        <span className="text-black font-black">250 AED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume Factor ({customMl}ml)</span>
                        <span className="text-black font-black">x{(ML_OPTIONS.find(o => o.size === customMl)?.multiplier || 1.0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Concentration Factor ({customConcentration.split('(')[0].trim()})</span>
                        <span className="text-black font-black">x{customConcentration.includes('Extrait') ? '1.25' : customConcentration.includes('Toilette') || customConcentration.includes('EDT') ? '0.85' : customConcentration.includes('Oil') ? '1.40' : '1.00'}</span>
                      </div>
                      
                      {(() => {
                        const sizeMultiplier = ML_OPTIONS.find(o => o.size === customMl)?.multiplier || 1.0;
                        const premiumCount = [...customTopNotes, ...customMiddleNotes, ...customBaseNotes].filter(note => PREMIUM_NOTES.includes(note)).length;
                        if (premiumCount > 0) {
                          return (
                            <div className="flex justify-between text-[#C5A059] bg-[#C5A059]/5 p-2 rounded-lg mt-2">
                              <span>Premium Note Surcharge ({premiumCount} notes)</span>
                              <span className="font-mono font-black">+{premiumCount * 20 * sizeMultiplier} AED</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="pt-4 border-t border-gray-200/60 flex items-end justify-between">
                      <div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">CALCULATED VALUE</span>
                        <div className="text-3xl font-black font-display text-[#C5A059] tracking-tighter mt-1">
                          {formatCurrency(calculateCustomBlendPrice())}
                        </div>
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold uppercase pb-1">Incl. 5% VAT</span>
                    </div>

                    {/* Action triggers */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={handleAddCustomBlendToCart}
                        className="w-full py-4 bg-black hover:bg-[#C5A059] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} strokeWidth={3} />
                        Add Bespoke Blend to Cart
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveFormulaToCustomer}
                        className={cn(
                          "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 active:scale-95 flex items-center justify-center gap-2",
                          selectedCustomer 
                            ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-100" 
                            : "bg-gray-100/50 text-gray-300 border-transparent cursor-not-allowed"
                        )}
                        title={selectedCustomer ? "Record formulation to customer profile" : "Select a customer to enable saving"}
                      >
                        <Save size={16} />
                        {selectedCustomer ? `Record to ${selectedCustomer.name}'s Profile` : "Save (Select Customer First)"}
                      </button>
                    </div>
                  </div>

                  {/* Customer Historical Blends List */}
                  <div className="flex-1 flex flex-col min-h-[150px] overflow-hidden">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2 shrink-0">
                      <BookOpen size={14} className="text-gray-400" />
                      Client Scent Profile Archives
                    </h4>

                    {selectedCustomer ? (
                      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3">
                        {selectedCustomer.customFormulas && selectedCustomer.customFormulas.length > 0 ? (
                          selectedCustomer.customFormulas.map(formula => (
                            <div key={formula.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-2 hover:border-[#C5A059]/30 transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-bold uppercase text-xs text-gray-800 tracking-tight">{formula.name}</h5>
                                  <p className="text-[8px] text-gray-400 font-black tracking-widest mt-0.5">{formula.selectedMl}ML • {formula.concentration.split('(')[0].trim()}</p>
                                </div>
                                <span className="font-mono font-black text-xs text-[#C5A059]">{formatCurrency(formula.price)}</span>
                              </div>

                              <p className="text-[8.5px] text-gray-500 font-mono leading-normal bg-gray-50 p-2 rounded-xl border border-gray-50">
                                <strong>Top:</strong> {(formula.topNotes || []).join(', ') || 'None'} | <strong>Mid:</strong> {(formula.middleNotes || []).join(', ') || 'None'} | <strong>Base:</strong> {(formula.baseNotes || []).join(', ') || 'None'}
                              </p>

                              <div className="flex gap-2 justify-end mt-1">
                                <button 
                                  type="button" 
                                  onClick={() => handleLoadFormula(formula)}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                                >
                                  Load Formula
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    handleAddSavedFormulaToCart(formula);
                                    alert(`Loaded & added "${formula.name}" directly to active cart.`);
                                  }}
                                  className="px-3 py-1.5 bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-white text-[#C5A059] rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                                >
                                  Add to Cart
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-300">
                            <FlaskConical className="w-10 h-10 mb-2 stroke-1 text-gray-200" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">No Custom Formulas Recorded</p>
                            <p className="text-[8px] text-gray-300 uppercase tracking-widest mt-1">Create a custom blend and save it above!</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-300 border-2 border-dashed border-gray-100 rounded-3xl">
                        <UserPlus className="w-10 h-10 mb-2 stroke-1 text-gray-200" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">NO ACTIVE CLIENT SESSION</p>
                        <p className="text-[8px] text-gray-300 uppercase tracking-widest mt-1">Select a customer profile to unlock historic scent records and formula saves</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Selection Modal */}
      <AnimatePresence>
        {showCustomerSearch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCustomerSearch(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="font-display text-3xl font-black uppercase tracking-tighter">CLIENT_NODE_SYNC</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">ASSOCIATE ENTITY TO SEQUENCE</p>
                </div>
                <button onClick={() => setShowCustomerSearch(false)} className="w-12 h-12 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 hover:text-black transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="relative mb-8">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="FILTER CLIENT NODES (NAME, PHONE, EMAIL)..."
                  value={customerSearchQuery}
                  onChange={e => {
                    const val = e.target.value;
                    setCustomerSearchQuery(val);
                    if (val.includes('@')) {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(val)) {
                        setCustomerEmailError('Node format error: Invalid email signature');
                      } else {
                        setCustomerEmailError('');
                      }
                    } else {
                      setCustomerEmailError('');
                    }
                  }}
                  className={cn(
                    "w-full pl-16 pr-6 py-5 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm tracking-tight focus:ring-1 focus:ring-black",
                    customerEmailError ? "ring-1 ring-red-500 bg-red-50/10" : ""
                  )}
                />
                {customerEmailError && (
                  <p className="mt-2 ml-6 text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">{customerEmailError}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-2">
                {selectedCustomer ? (
                   <div className="p-6 rounded-3xl bg-[#C5A059] text-white flex items-center justify-between shadow-xl">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                            {selectedCustomer.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <div className="font-black uppercase tracking-tight">{selectedCustomer.name}</div>
                            <div className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-1">{selectedCustomer.phone}</div>
                         </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center hover:bg-black/40 transition-all">
                        <X size={20} />
                      </button>
                   </div>
                ) : filteredCustomers.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }}
                    className="w-full p-6 text-left rounded-3xl hover:bg-gray-50 group flex items-center justify-between border border-transparent hover:border-gray-100 transition-all"
                  >
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all text-gray-400 group-hover:text-black font-black text-xl">
                           {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <div className="font-black uppercase tracking-tight group-hover:text-[#C5A059] transition-colors">{c.name}</div>
                           <div className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 uppercase">{c.phone}</div>
                        </div>
                     </div>
                     <Plus size={20} className="text-gray-200 group-hover:text-black group-hover:rotate-90 transition-all" />
                  </button>
                ))}
              </div>
              
              <button 
                 onClick={() => { /* Navigate to Customers for new profile creation logic could go here */ }}
                 className="mt-10 py-5 w-full bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all border border-transparent hover:border-black"
              >
                 + Initialize New Client Entry
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {showReceiptModal && lastSale && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReceiptModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                         <Receipt size={20} />
                      </div>
                      <h3 className="font-black uppercase tracking-widest text-xs">Tax Invoice Preview</h3>
                   </div>
                   <button onClick={() => setShowReceiptModal(false)} className="w-10 h-10 hover:bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                      <X size={20} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 flex flex-col items-center">
                   <div id="receipt-content" className="w-full bg-white p-10 shadow-sm border border-gray-100 rounded-2xl flex flex-col items-center text-center font-mono text-[10px] space-y-6">
                      <div className="space-y-1">
                         <h2 className="text-[10px] font-black tracking-[0.4em] text-gray-400 mb-2">TAX INVOICE</h2>
                         <h2 className="text-xl font-black uppercase leading-tight">{profile?.companyName || 'SCENTS & SOULS PERFUME LAB'}</h2>
                         <p className="font-bold">{profile?.address}</p>
                         <div className="flex items-center justify-center gap-2 bg-gray-50 px-3 py-1 rounded-full mt-2 font-black border border-gray-100">
                            TRN: <span className="text-black">{profile?.trn || '100XXXXXXXXXXXX'}</span>
                         </div>
                         {profile?.phone && <p className="mt-1">TEL: {profile?.phone}</p>}
                      </div>

                      <div className="w-full border-y border-dashed border-gray-200 py-4 flex flex-col gap-2 items-start text-left">
                         <div className="flex justify-between w-full">
                           <span className="text-gray-400">INVOICE_ID:</span> <span className="font-black">{lastSale.invoiceNumber}</span>
                         </div>
                         <div className="flex justify-between w-full">
                           <span className="text-gray-400">TIMESTAMP:</span> <span className="font-black">{new Date(lastSale.createdAt).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between w-full">
                           <span className="text-gray-400">CASHIER_NODE:</span> <span className="font-black uppercase">{lastSale.cashierName}</span>
                         </div>
                         <div className="flex justify-between w-full">
                           <span className="text-gray-400">CLIENT_ENTITY:</span> <span className="font-black uppercase">{lastSale.customerName}</span>
                         </div>
                      </div>

                      <div className="w-full space-y-4">
                         <div className="flex justify-between font-black border-b border-black pb-2 text-[8px] tracking-widest text-gray-400">
                            <span className="flex-[2] text-left">ITEM_DESCRIPTION</span>
                            <span className="flex-1 text-center">QTY</span>
                            <span className="flex-1 text-right">TOTAL_GROSS</span>
                         </div>
                         <div className="space-y-3">
                           {lastSale.items.map((item, idx) => (
                             <div key={idx} className="flex flex-col gap-1">
                               <div className="flex justify-between items-start">
                                  <span className="flex-[2] text-left uppercase font-bold leading-tight">{item.name}</span>
                                  <span className="flex-1 text-center font-bold">{item.quantity}</span>
                                  <span className="flex-1 text-right font-black">{formatCurrency(item.totalWithVat)}</span>
                               </div>
                               {item.imei && item.imei.length > 0 && (
                                  <div className="text-[8px] text-gray-400 text-left pl-2">
                                     SN: {item.imei.join(', ')}
                                  </div>
                               )}
                             </div>
                           ))}
                         </div>
                      </div>

                      <div className="w-full border-t-2 border-black pt-4 space-y-2">
                         <div className="flex justify-between font-bold">
                            <span className="text-gray-400 uppercase tracking-widest">SUBTOTAL (EXCL. VAT)</span> 
                            <span>{formatCurrency(lastSale.subtotal)}</span>
                         </div>
                         <div className="flex justify-between font-bold">
                            <span className="text-gray-400 uppercase tracking-widest">VAT (5% STANDARD RATE)</span> 
                            <span>{formatCurrency(lastSale.vatTotal)}</span>
                         </div>
                         {lastSale.discount > 0 && (
                           <div className="flex justify-between text-red-500 font-bold">
                              <span className="uppercase tracking-widest">CALIBRATION DISCOUNT</span> 
                              <span>-{formatCurrency(lastSale.discount)}</span>
                           </div>
                         )}
                         <div className="flex justify-between text-xl font-black pt-4 border-t border-dashed border-gray-200 mt-2">
                            <span className="tracking-tighter">GRAND TOTAL</span> 
                            <span className="text-black">{formatCurrency(lastSale.grandTotal)}</span>
                         </div>
                      </div>

                      <div className="w-full space-y-1 pt-4 border-t border-gray-50 bg-gray-50/50 p-4 rounded-xl">
                         <div className="flex justify-between font-bold">
                            <span className="text-gray-400 uppercase tracking-widest text-[8px]">TENDERED ({lastSale.paymentMethod}):</span> <span className="font-black">{formatCurrency(lastSale.receivedAmount)}</span>
                         </div>
                         <div className="flex justify-between font-bold">
                            <span className="text-gray-400 uppercase tracking-widest text-[8px]">CHANGE RETURNED:</span> <span className="font-black">{formatCurrency(lastSale.changeAmount)}</span>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-dashed border-gray-200 w-full space-y-4">
                         <div className="space-y-1">
                           <p className="font-bold">THANK YOU FOR CHOOSING OUR SERVICE</p>
                           <p className="text-[8px] opacity-40 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">{profile?.footerNote || 'Subject to UAE Federal Tax Authority Regulations'}</p>
                         </div>
                         
                         <div className="pt-4 flex flex-col items-center justify-center gap-2">
                            <div className="p-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center">
                               <QRCodeSVG 
                                 value={`${window.location.origin}?invoice=${lastSale.invoiceNumber}`} 
                                 size={96} 
                                 level="H"
                                 includeMargin={false}
                               />
                            </div>
                            <p className="text-[7px] text-gray-400 font-bold uppercase tracking-[0.15em] leading-relaxed max-w-[220px] mx-auto">
                              Scan for digital invoice, 3D flacon & care rituals
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-8 border-t border-gray-50 flex gap-4">
                   <button 
                     onClick={() => window.print()}
                     className="flex-1 bg-black text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20"
                   >
                     <Printer size={18} /> Print Thermal
                   </button>
                   <button 
                     onClick={() => setShowReceiptModal(false)}
                     className="flex-1 bg-gray-50 text-gray-400 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100"
                   >
                     Done
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBarcodeScanner && (
          <BarcodeScannerModal
            isOpen={showBarcodeScanner}
            onClose={() => setShowBarcodeScanner(false)}
            onScanSuccess={handleBarcodeScan}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
