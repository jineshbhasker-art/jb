/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Package,
  Barcode,
  QrCode,
  X,
  Camera,
  RefreshCw,
  Save,
  Info,
  Calculator,
  FlaskConical,
  Calendar,
  MapPin,
  Clock,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Database,
  Gauge,
  Upload,
  FileSpreadsheet,
  Check,
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Mic,
  MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BarcodeDisplay from 'react-barcode';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ScanBarcode } from 'lucide-react';
import { cn, formatCurrency, generateBarcode } from '../lib/utils';
import { Product, ProductType, BusinessProfile, ConcentrationAlertRule, PerfumeBatch, Sale } from '../types';
import { productsService, businessProfileService, concentrationAlertRulesService, batchesService, salesService } from '../lib/dbService';
import { CATEGORIES, BRANDS } from '../constants';
import { useReactToPrint } from 'react-to-print';
import { PrintShelfTalkers } from '../components/PrintShelfTalkers';
import { ForecastingModule } from '../components/ForecastingModule';
import QRCode from 'react-qr-code';

export default function Inventory() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<string>('All Brands');
  const [alertRules, setAlertRules] = React.useState<ConcentrationAlertRule[]>([]);

  const [showShelfTalkerModal, setShowShelfTalkerModal] = React.useState(false);
  const [shelfTalkerIncludeNotes, setShelfTalkerIncludeNotes] = React.useState(true);
  const [shelfTalkerIncludeQrCode, setShelfTalkerIncludeQrCode] = React.useState(true);
  const [shelfTalkerTheme, setShelfTalkerTheme] = React.useState<'luxury-dark' | 'minimalist-light' | 'boutique-gold'>('luxury-dark');
  const [shelfTalkerSize, setShelfTalkerSize] = React.useState<'standard' | 'large' | 'compact'>('standard');
  const [selectedProductsForShelf, setSelectedProductsForShelf] = React.useState<string[]>([]);
  
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [selectedProductForQr, setSelectedProductForQr] = React.useState<Product | null>(null);
  const [qrLabelSize, setQrLabelSize] = React.useState<'compact' | 'standard' | 'detailed'>('standard');
  const [qrCount, setQrCount] = React.useState<number>(1);

  const shelfPrintRef = React.useRef<HTMLDivElement>(null);
  const handlePrintShelfTalkers = useReactToPrint({
    contentRef: shelfPrintRef,
    documentTitle: 'Scent_Shelf_Talkers',
  });

  const qrPrintRef = React.useRef<HTMLDivElement>(null);
  const handlePrintQrCode = useReactToPrint({
    contentRef: qrPrintRef,
    documentTitle: 'Product_QR_Codes',
  });
  
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    type: ProductType.NEW,
    category: 'Oud & Oriental',
    brand: '',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    imeiRequired: true,
    image: '',
    vatRate: 0.05,
    isActive: true,
    scentFamily: '',
    concentration: '',
    topNotes: '',
    middleNotes: '',
    baseNotes: ''
  });

  // Batch & Expiry tracking states
  const [activeTab, setActiveTab] = React.useState<'products' | 'batches' | 'forecasting'>('products');
  const [batches, setBatches] = React.useState<PerfumeBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = React.useState(true);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [showBatchModal, setShowBatchModal] = React.useState(false);
  const [isEditingBatch, setIsEditingBatch] = React.useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = React.useState('');
  const [batchCarrierFilter, setBatchCarrierFilter] = React.useState<string>('all');
  const [batchStatusFilter, setBatchStatusFilter] = React.useState<string>('all');
  const [seedingBatches, setSeedingBatches] = React.useState(false);

  // Quick adjust states
  const [adjustingBatchId, setAdjustingBatchId] = React.useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = React.useState<number>(0);
  const [adjustType, setAdjustType] = React.useState<'deduct' | 'refill'>('deduct');

  const [newBatch, setNewBatch] = React.useState<Partial<PerfumeBatch>>({
    batchNumber: '',
    productId: '',
    productName: '',
    carrierType: 'oil_base',
    manufactureDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    initialQuantityMl: 1000,
    remainingQuantityMl: 1000,
    costPerMl: 1.5,
    locationSlot: '',
    notes: ''
  });

  // CSV Import States
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [importDragActive, setImportDragActive] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importPreview, setImportPreview] = React.useState<any[]>([]);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importMode, setImportMode] = React.useState<'overwrite' | 'skip'>('skip');

  // Web Speech API Voice Search States & Logic
  const [isListening, setIsListening] = React.useState(false);
  const [listeningTarget, setListeningTarget] = React.useState<'products' | 'batches' | null>(null);
  const [voiceFeedback, setVoiceFeedback] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const handleBarcodeScan = (barcode: string) => {
    if (showAddModal) {
      setNewProduct(prev => ({ ...prev, barcode }));
    } else if (activeTab === 'batches') {
      setBatchSearchQuery(barcode);
    } else {
      setSearchQuery(barcode);
    }
  };

  const toggleVoiceSearch = (target: 'products' | 'batches') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please try using Google Chrome, Microsoft Edge, or Apple Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setListeningTarget(null);
      setVoiceFeedback(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setListeningTarget(target);
        setVoiceFeedback("Listening... Say a product name or code.");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (target === 'products') {
          setSearchQuery(transcript);
        } else {
          setBatchSearchQuery(transcript);
        }
        setVoiceFeedback(`Searched: "${transcript}"`);
        setTimeout(() => setVoiceFeedback(null), 3500);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setVoiceFeedback("Microphone access blocked.");
        } else {
          setVoiceFeedback(`Error: ${event.error}`);
        }
        setIsListening(false);
        setListeningTarget(null);
        setTimeout(() => setVoiceFeedback(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setListeningTarget(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      setListeningTarget(null);
    }
  };

  // Stop listening on unmount
  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Stop listening if the tab changes
  React.useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setListeningTarget(null);
    setVoiceFeedback(null);
  }, [activeTab]);

  React.useEffect(() => {
    const unsubProducts = productsService.subscribe((data) => {
      setProducts(data);
      setLoading(false);
    });
    const unsubProfile = businessProfileService.subscribe(setProfile);
    const unsubRules = concentrationAlertRulesService.subscribe(setAlertRules);
    
    const unsubBatches = batchesService.subscribe((data) => {
      setBatches(data);
      setBatchesLoading(false);
    });

    const unsubSales = salesService.subscribe((data) => {
      setSales(data || []);
    });

    return () => {
      unsubProducts();
      unsubProfile();
      unsubRules();
      unsubBatches();
      unsubSales();
    };
  }, []);

  const handleAddNewBatch = () => {
    setIsEditingBatch(false);
    const generatedNum = `B-SCN-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewBatch({
      batchNumber: generatedNum,
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      carrierType: 'oil_base',
      manufactureDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
      initialQuantityMl: 1000,
      remainingQuantityMl: 1000,
      costPerMl: 1.5,
      locationSlot: '',
      notes: ''
    });
    setShowBatchModal(true);
  };

  const handleEditBatch = (batch: PerfumeBatch) => {
    setIsEditingBatch(true);
    setNewBatch({ ...batch });
    setShowBatchModal(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const linkedProd = products.find(p => p.id === newBatch.productId);
      const updatedBatch = {
        ...newBatch,
        productName: linkedProd ? linkedProd.name : (newBatch.productName || 'Raw Ingredient'),
        sku: linkedProd ? linkedProd.sku : 'RAW'
      };

      if (isEditingBatch && newBatch.id) {
        await batchesService.update(newBatch.id, updatedBatch);
      } else {
        await batchesService.add(updatedBatch as Omit<PerfumeBatch, 'id'>);
      }
      setShowBatchModal(false);
    } catch (err) {
      console.error("Save batch error:", err);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (window.confirm('Are you sure you want to retire this perfume/base batch?')) {
      await batchesService.delete(id);
    }
  };

  const handleQuickAdjustBatchVolume = async (batchId: string, amount: number, type: 'deduct' | 'refill') => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;
    
    let newVolume = batch.remainingQuantityMl;
    if (type === 'deduct') {
      newVolume = Math.max(0, batch.remainingQuantityMl - amount);
    } else {
      newVolume = Math.min(batch.initialQuantityMl, batch.remainingQuantityMl + amount);
    }

    try {
      await batchesService.update(batchId, {
        remainingQuantityMl: newVolume
      });
      setAdjustingBatchId(null);
      setAdjustAmount(0);
    } catch (err) {
      console.error("Volume adjustment error:", err);
    }
  };

  const handleSeedDemoBatches = async () => {
    setSeedingBatches(true);
    try {
      const existingProducts = products;
      let oilProduct = existingProducts.find(p => p.category.includes('Oil') || p.name.includes('Aventus'));
      let baccaratProduct = existingProducts.find(p => p.name.includes('Baccarat'));
      let saffronProduct = existingProducts.find(p => p.name.includes('Saffron'));
      
      const pId1 = oilProduct?.id || 'dummy-oil-1';
      const pName1 = oilProduct?.name || 'Aventus Premium Oil';
      
      const pId2 = baccaratProduct?.id || 'dummy-oil-2';
      const pName2 = baccaratProduct?.name || 'Baccarat Rouge 540 Concentrated';

      const pId3 = saffronProduct?.id || 'dummy-oil-3';
      const pName3 = saffronProduct?.name || 'Imperial Saffron Essence';

      const demoBatches: Omit<PerfumeBatch, 'id'>[] = [
        {
          batchNumber: 'B-OIL-AVN-001',
          productId: pId1,
          productName: pName1,
          sku: oilProduct?.sku || 'CRD-AVN-100',
          carrierType: 'oil_base',
          manufactureDate: new Date(new Date().setDate(new Date().getDate() - 700)).toISOString().split('T')[0],
          expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Expires in 30 days
          initialQuantityMl: 1000,
          remainingQuantityMl: 450,
          costPerMl: 2.2,
          locationSlot: 'Dark Cabinet B, Slot 4',
          notes: 'High refractive index, verified under scent chromatography.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          batchNumber: 'B-MXD-BR540-002',
          productId: pId2,
          productName: pName2,
          sku: baccaratProduct?.sku || 'MFK-BR540-70',
          carrierType: 'mixed_fragrance',
          manufactureDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
          expiryDate: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], // Expired 15 days ago
          initialQuantityMl: 500,
          remainingQuantityMl: 120,
          costPerMl: 3.5,
          locationSlot: 'Lab Refrigerator A',
          notes: 'Deteriorated amber aroma notes. Marked for QC disposal.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          batchNumber: 'B-ALC-ETH-99',
          productId: 'alc-ethanol-base',
          productName: 'Raw Alcohol Base (99.9% Denatured)',
          sku: 'ETH-99',
          carrierType: 'alcohol_base',
          manufactureDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0], // 3 years shelf life
          initialQuantityMl: 5000,
          remainingQuantityMl: 4800,
          costPerMl: 0.15,
          locationSlot: 'Bulk Chemical Locker Row 1',
          notes: 'High-purity cosmetic grade ethanol. Double sealed.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          batchNumber: 'B-OIL-IMS-004',
          productId: pId3,
          productName: pName3,
          sku: saffronProduct?.sku || 'SAS-IMS-100',
          carrierType: 'oil_base',
          manufactureDate: new Date(new Date().setDate(new Date().getDate() - 180)).toISOString().split('T')[0],
          expiryDate: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString().split('T')[0], // Expires in 12 days
          initialQuantityMl: 250,
          remainingQuantityMl: 35,
          costPerMl: 4.8,
          locationSlot: 'Cold Safe Drawer A1',
          notes: 'Rare saffron absolute. Keep strictly in dark storage below 15C.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const batch of demoBatches) {
        await batchesService.add(batch as any);
      }
    } catch (error) {
      console.error("Error seeding batches:", error);
    } finally {
      setSeedingBatches(false);
    }
  };

  const getBatchStatus = (expiryDate: string, remainingQuantityMl: number): 'expired' | 'near-expiry' | 'active' | 'depleted' => {
    if (remainingQuantityMl <= 0) return 'depleted';
    const today = new Date();
    const exp = new Date(expiryDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'expired';
    if (diffDays <= 90) return 'near-expiry';
    return 'active';
  };

  const handleGenerateBarcode = () => {
    setNewProduct(prev => ({ ...prev, barcode: generateBarcode() }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('CRITICAL: IMAGE SIZE OVERLOAD. MAX 1MB.');
        return;
      }
      
      const allowedTypes = ['image/png', 'image/jpeg', 'image/bmp'];
      if (!allowedTypes.includes(file.type)) {
        alert('UNSUPPORTED FORMAT: USE PNG, JPEG, OR BMP.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setNewProduct({
      name: '',
      sku: '',
      barcode: '',
      type: ProductType.NEW,
      category: 'Oud & Oriental',
      brand: '',
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      imeiRequired: true,
      image: '',
      vatRate: 0.05,
      isActive: true,
      scentFamily: '',
      concentration: '',
      topNotes: '',
      middleNotes: '',
      baseNotes: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (product: Product) => {
    setIsEditing(true);
    setNewProduct({ ...product });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && newProduct.id) {
        await productsService.update(newProduct.id, newProduct);
      } else {
        await productsService.add(newProduct as Omit<Product, 'id'>);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await productsService.delete(id);
    }
  };

  const [seeding, setSeeding] = React.useState(false);

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      const existingProducts = await productsService.getAll() || [];
      const existingSKUs = new Set(existingProducts.map(p => p.sku));

      const premiumScentLibrary = [
        {
          name: 'Aventus',
          sku: 'CRD-AVN-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Creed',
          costPrice: 950,
          sellingPrice: 1450,
          stockQuantity: 25,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Citrus & Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Pineapple, Bergamot, Blackcurrant, Apple',
          middleNotes: 'Birch, Patchouli, Moroccan Jasmine, Rose',
          baseNotes: 'Musk, Oakmoss, Ambergris, Vanilla'
        },
        {
          name: 'Green Irish Tweed',
          sku: 'CRD-GIT-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Creed',
          costPrice: 850,
          sellingPrice: 1250,
          stockQuantity: 15,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Fougère & Fresh',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Lemon Verbena, Iris',
          middleNotes: 'Violet Leaves',
          baseNotes: 'Ambergris, Sandalwood'
        },
        {
          name: 'Baccarat Rouge 540',
          sku: 'MFK-BR540-70',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Maison Francis Kurkdjian',
          costPrice: 920,
          sellingPrice: 1400,
          stockQuantity: 30,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Floral',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Saffron, Jasmine',
          middleNotes: 'Amberwood, Ambergris',
          baseNotes: 'Fir Resin, Cedar'
        },
        {
          name: 'Oud Satin Mood',
          sku: 'MFK-OSM-70',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Maison Francis Kurkdjian',
          costPrice: 950,
          sellingPrice: 1450,
          stockQuantity: 14,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Bulgarian Rose, Blue Chamomile',
          middleNotes: 'Turkish Rose, Oud Wood, Violet',
          baseNotes: 'Bourbon Vanilla, Amber'
        },
        {
          name: 'Reflection Man',
          sku: 'AMG-REF-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Amouage',
          costPrice: 820,
          sellingPrice: 1200,
          stockQuantity: 18,
          minStockLevel: 4,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Floral Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Rosemary, Red Pepper Berries, Bitter Orange Leaves',
          middleNotes: 'Neroli, Orris, Jasmine, Ylang-Ylang',
          baseNotes: 'Vetiver, Patchouli, Sandalwood, Cedarwood'
        },
        {
          name: 'Interlude Man',
          sku: 'AMG-INT-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Amouage',
          costPrice: 890,
          sellingPrice: 1350,
          stockQuantity: 4,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Bergamot, Oregano, Pimento Berry Oil',
          middleNotes: 'Amber, Frankincense, Cistus, Opoponax',
          baseNotes: 'Leather, Agarwood Smoke, Patchouli, Sandalwood'
        },
        {
          name: 'Tobacco Vanille',
          sku: 'TFD-TBV-50',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Tom Ford',
          costPrice: 750,
          sellingPrice: 1150,
          stockQuantity: 15,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Warm & Sweet',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Tobacco Leaf, Spicy Notes',
          middleNotes: 'Vanilla, Cacao, Tonka Bean, Tobacco Blossom',
          baseNotes: 'Dried Fruits, Woody Notes'
        },
        {
          name: 'Oud Wood',
          sku: 'TFD-ODW-50',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Tom Ford',
          costPrice: 750,
          sellingPrice: 1150,
          stockQuantity: 2,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Rosewood, Cardamom, Chinese Pepper',
          middleNotes: 'Oud, Sandalwood, Vetiver',
          baseNotes: 'Tonka Bean, Vanilla, Amber'
        },
        {
          name: 'Shaghaf Oud',
          sku: 'SWA-SGF-75',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Swiss Arabian',
          costPrice: 90,
          sellingPrice: 220,
          stockQuantity: 80,
          minStockLevel: 8,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Oud & Amber',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Saffron, Oud',
          middleNotes: 'Rose, Praline',
          baseNotes: 'Agarwood, Vanilla'
        },
        {
          name: 'Layali',
          sku: 'SWA-LYL-50',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'French Florals',
          brand: 'Swiss Arabian',
          costPrice: 85,
          sellingPrice: 185,
          stockQuantity: 45,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Fruity Floral',
          concentration: 'Concentrated Perfume Oil',
          topNotes: 'Cherry, Blackcurrant, Orange Blossom',
          middleNotes: 'Ylang-Ylang, Rose, Jasmine',
          baseNotes: 'Agarwood, Amber'
        },
        {
          name: 'Imperial Saffron',
          sku: 'SAS-IMS-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Bespoke Blends',
          brand: 'Scents & Souls',
          costPrice: 450,
          sellingPrice: 950,
          stockQuantity: 50,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Bespoke Oriental',
          concentration: 'Extrait de Parfum (25-40%)',
          topNotes: 'Royal Oud, Saffron Dust, White Truffle',
          middleNotes: 'Damask Rose, Midnight Amber, Frankincense',
          baseNotes: 'Siberian Musk, Warm Vetiver, Sandalwood Tears'
        }
      ];

      for (const item of premiumScentLibrary) {
        if (!existingSKUs.has(item.sku)) {
          await productsService.add(item as any);
        }
      }
    } catch (error) {
      console.error("Error seeding inventory:", error);
    } finally {
      setSeeding(false);
    }
  };

  const [filterMode, setFilterMode] = React.useState<'all' | 'low' | 'instock'>('all');

  const escapeCSVValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCSV = () => {
    const headers = [
      'Name', 
      'SKU', 
      'Barcode', 
      'Category', 
      'Brand', 
      'Cost Price', 
      'Selling Price', 
      'Stock', 
      'Min Level',
      'Scent Family',
      'Concentration',
      'Top Notes',
      'Middle Notes',
      'Base Notes',
      'Description',
      'Type',
      'VAT Rate',
      'Is Active'
    ];
    const rows = filteredProducts.map(p => [
      p.name,
      p.sku,
      p.barcode,
      p.category,
      p.brand || '',
      p.costPrice,
      p.sellingPrice,
      p.stockQuantity,
      p.minStockLevel,
      p.scentFamily || '',
      p.concentration || '',
      p.topNotes || '',
      p.middleNotes || '',
      p.baseNotes || '',
      p.description || '',
      p.type || 'new',
      p.vatRate || 0.05,
      p.isActive !== false ? 'true' : 'false'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(escapeCSVValue).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++; // skip next double quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentValue.trim());
        if (row.length > 1 || row[0] !== '') {
          lines.push(row);
        }
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    if (currentValue !== '' || row.length > 0) {
      row.push(currentValue.trim());
      lines.push(row);
    }
    return lines;
  };

  const parseCSVFile = (file: File) => {
    setImportError(null);
    setImportPreview([]);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error("EMPTY FILE OR READ FAILURE.");
        }

        const rawLines = parseCSV(text);
        if (rawLines.length === 0) {
          throw new Error("NO ROWS FOUND IN CSV.");
        }

        // Header row mapping
        const rawHeaders = rawLines[0];
        const rows = rawLines.slice(1);

        const headerMapping: { [key: string]: string } = {
          'name': 'name',
          'sku': 'sku',
          'barcode': 'barcode',
          'category': 'category',
          'brand': 'brand',
          'cost price': 'costPrice',
          'costprice': 'costPrice',
          'cost': 'costPrice',
          'selling price': 'sellingPrice',
          'sellingprice': 'sellingPrice',
          'price': 'sellingPrice',
          'stock': 'stockQuantity',
          'stock quantity': 'stockQuantity',
          'quantity': 'stockQuantity',
          'min level': 'minStockLevel',
          'minstocklevel': 'minStockLevel',
          'minimum level': 'minStockLevel',
          'scent family': 'scentFamily',
          'scentfamily': 'scentFamily',
          'concentration': 'concentration',
          'top notes': 'topNotes',
          'topnotes': 'topNotes',
          'middle notes': 'middleNotes',
          'middlenotes': 'middleNotes',
          'base notes': 'baseNotes',
          'basenotes': 'baseNotes',
          'description': 'description',
          'type': 'type',
          'vat rate': 'vatRate',
          'vatrate': 'vatRate',
          'is active': 'isActive',
          'isactive': 'isActive',
          'active': 'isActive'
        };

        const mappedHeaders = rawHeaders.map(h => {
          const clean = h.trim().toLowerCase();
          return headerMapping[clean] || clean;
        });

        const parsedProducts: any[] = [];
        const existingSkus = new Set(products.map(p => p.sku.trim().toLowerCase()));

        for (let idx = 0; idx < rows.length; idx++) {
          const row = rows[idx];
          if (row.length === 0 || (row.length === 1 && row[0] === '')) {
            continue;
          }

          const item: any = {
            type: ProductType.NEW,
            vatRate: 0.05,
            isActive: true,
            imeiRequired: false,
            scentFamily: '',
            concentration: '',
            topNotes: '',
            middleNotes: '',
            baseNotes: '',
            description: ''
          };

          mappedHeaders.forEach((header, colIdx) => {
            if (colIdx < row.length) {
              const val = row[colIdx].trim();
              if (header === 'name') item.name = val;
              else if (header === 'sku') item.sku = val;
              else if (header === 'barcode') item.barcode = val;
              else if (header === 'category') item.category = val;
              else if (header === 'brand') item.brand = val;
              else if (header === 'costPrice') item.costPrice = parseFloat(val) || 0;
              else if (header === 'sellingPrice') item.sellingPrice = parseFloat(val) || 0;
              else if (header === 'stockQuantity') item.stockQuantity = parseInt(val, 10) || 0;
              else if (header === 'minStockLevel') item.minStockLevel = parseInt(val, 10) || 5;
              else if (header === 'scentFamily') item.scentFamily = val;
              else if (header === 'concentration') item.concentration = val;
              else if (header === 'topNotes') item.topNotes = val;
              else if (header === 'middleNotes') item.middleNotes = val;
              else if (header === 'baseNotes') item.baseNotes = val;
              else if (header === 'description') item.description = val;
              else if (header === 'type') {
                const lType = val.toLowerCase();
                if (lType === 'new' || lType === 'used' || lType === 'repair' || lType === 'accessory') {
                  item.type = lType as ProductType;
                } else {
                  item.type = ProductType.NEW;
                }
              }
              else if (header === 'vatRate') {
                const parsedVat = parseFloat(val);
                item.vatRate = isNaN(parsedVat) ? 0.05 : parsedVat;
              }
              else if (header === 'isActive') item.isActive = val.toLowerCase() !== 'false';
            }
          });

          const validationErrors: string[] = [];
          if (!item.name) {
            validationErrors.push("NAME REQUIRED");
          }
          if (!item.sku) {
            validationErrors.push("SKU REQUIRED");
          }

          if (item.sku) {
            const normalizedSku = item.sku.trim().toLowerCase();
            item.skuExists = existingSkus.has(normalizedSku);
          }

          if (!item.barcode && item.name) {
            item.barcode = generateBarcode();
            item.barcodeGenerated = true;
          }

          if (!item.category) {
            item.category = 'Oud & Oriental';
          }

          item.validationErrors = validationErrors;
          item.isValid = validationErrors.length === 0;
          parsedProducts.push(item);
        }

        if (parsedProducts.length === 0) {
          throw new Error("COULD NOT PARSE ANY VALID RECORDS. PLEASE CHECK FILE FORMAT.");
        }

        setImportPreview(parsedProducts);
      } catch (err: any) {
        setImportError(err.message || "An error occurred while parsing the CSV file.");
      }
    };

    reader.onerror = () => {
      setImportError("FAILED TO READ FILE.");
    };

    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Name', 
      'SKU', 
      'Barcode', 
      'Category', 
      'Brand', 
      'Cost Price', 
      'Selling Price', 
      'Stock', 
      'Min Level',
      'Scent Family',
      'Concentration',
      'Top Notes',
      'Middle Notes',
      'Base Notes',
      'Description',
      'Type',
      'VAT Rate',
      'Is Active'
    ];
    const sampleRow = [
      'SNS Rose Damascena EDP 100ml', 
      'SNS-RD-100', 
      '6291234567890', 
      'Bespoke Blends', 
      'Scents & Souls', 
      '120', 
      '320', 
      '15', 
      '3',
      'Floral & Woody',
      'Eau de Parfum (EDP) (15-20%)',
      'Rose, Damascena, Bergamot',
      'Patchouli, Moroccan Jasmine',
      'Musk, Sandalwood',
      'An exquisite, rich, sweet rose-centered perfume formulation.',
      'new',
      '0.05',
      'true'
    ];
    const csvContent = [headers, sampleRow]
      .map(row => row.map(escapeCSVValue).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_upload_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessImport = async () => {
    if (importPreview.length === 0) return;
    setImportLoading(true);
    setImportError(null);

    try {
      let importedCount = 0;
      let updatedCount = 0;

      const skuToProductMap = new Map<string, Product>();
      products.forEach(p => {
        if (p.sku) {
          skuToProductMap.set(p.sku.trim().toLowerCase(), p);
        }
      });

      for (const item of importPreview) {
        if (!item.isValid) continue;

        const normalizedSku = item.sku.trim().toLowerCase();
        const existingProduct = skuToProductMap.get(normalizedSku);

        const nowIso = new Date().toISOString();
        const cleanItem: Omit<Product, 'id'> = {
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          category: item.category,
          brand: item.brand || 'Scents & Souls',
          costPrice: item.costPrice || 0,
          sellingPrice: item.sellingPrice || 0,
          stockQuantity: item.stockQuantity || 0,
          minStockLevel: item.minStockLevel || 5,
          type: item.type || ProductType.NEW,
          vatRate: item.vatRate || 0.05,
          isActive: item.isActive !== undefined ? item.isActive : true,
          imeiRequired: item.imeiRequired !== undefined ? item.imeiRequired : false,
          scentFamily: item.scentFamily || '',
          concentration: item.concentration || '',
          topNotes: item.topNotes || '',
          middleNotes: item.middleNotes || '',
          baseNotes: item.baseNotes || '',
          description: item.description || '',
          createdAt: existingProduct?.createdAt || nowIso,
          updatedAt: nowIso
        };

        if (existingProduct && existingProduct.id) {
          if (importMode === 'overwrite') {
            await productsService.update(existingProduct.id, {
              ...existingProduct,
              ...cleanItem,
              stockQuantity: cleanItem.stockQuantity
            });
            updatedCount++;
          }
        } else {
          await productsService.add(cleanItem);
          importedCount++;
        }
      }

      alert(`BULK UPLOAD SUCCESSFUL:\n- New products registered: ${importedCount}\n- Existing products updated: ${updatedCount}`);
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      setImportError(err.message || "An error occurred during bulk import.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setImportDragActive(true);
    } else if (e.type === "dragleave") {
      setImportDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImportDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        setImportFile(file);
        parseCSVFile(file);
      } else {
        setImportError("INVALID FILE TYPE. PLEASE CHOOSE A CSV FILE.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      parseCSVFile(file);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBrand = selectedBrand === 'All Brands' || p.brand === selectedBrand;
    
    if (filterMode === 'low') {
      const isLowStock = p.stockQuantity <= p.minStockLevel;
      const matchingRule = alertRules.filter(r => r.isActive).find(rule => {
        if (!p.concentration || !rule.concentration) return false;
        const prodConc = p.concentration.toLowerCase().trim();
        const ruleConc = rule.concentration.toLowerCase().trim();
        if (prodConc === ruleConc) return true;
        if (ruleConc.includes('edp') && (prodConc.includes('edp') || prodConc.includes('eau de parfum'))) return true;
        if (ruleConc.includes('edt') && (prodConc.includes('edt') || prodConc.includes('eau de toilette'))) return true;
        if (ruleConc.includes('oil') && (prodConc.includes('oil') || prodConc.includes('attar'))) return true;
        if (ruleConc.includes('extrait') && prodConc.includes('extrait')) return true;
        if (ruleConc.includes('parfum') && prodConc.includes('parfum') && !ruleConc.includes('eau de') && !prodConc.includes('eau de')) return true;
        return prodConc.includes(ruleConc) || ruleConc.includes(prodConc);
      });
      const isConcentrationLow = matchingRule ? (p.stockQuantity <= matchingRule.minStockThreshold) : false;
      return matchesQuery && matchesBrand && (isLowStock || isConcentrationLow);
    }
    if (filterMode === 'instock') return matchesQuery && matchesBrand && p.stockQuantity > 0;
    return matchesQuery && matchesBrand;
  });

  const filteredBatches = batches.filter(b => {
    const matchesQuery = b.batchNumber.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
                         b.productName.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
                         (b.sku && b.sku.toLowerCase().includes(batchSearchQuery.toLowerCase())) ||
                         (b.locationSlot && b.locationSlot.toLowerCase().includes(batchSearchQuery.toLowerCase()));
    
    const matchesCarrier = batchCarrierFilter === 'all' || b.carrierType === batchCarrierFilter;
    
    const status = getBatchStatus(b.expiryDate, b.remainingQuantityMl);
    const matchesStatus = batchStatusFilter === 'all' || status === batchStatusFilter;
    
    return matchesQuery && matchesCarrier && matchesStatus;
  });

  const batchStats = React.useMemo(() => {
    let active = 0;
    let nearExpiry = 0;
    let expired = 0;
    let totalMl = 0;

    batches.forEach(b => {
      const status = getBatchStatus(b.expiryDate, b.remainingQuantityMl);
      if (status === 'active') active++;
      else if (status === 'near-expiry') {
        nearExpiry++;
        active++;
      } else if (status === 'expired') {
        expired++;
      }
      totalMl += b.remainingQuantityMl || 0;
    });

    return { active, nearExpiry, expired, totalMl };
  }, [batches]);

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">
            {activeTab === 'products' ? 'STOCK CONTROL' : activeTab === 'batches' ? 'BATCH & SHELF LIFE' : 'STOCK FORECAST'}
          </h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
             System Node: {profile?.companyName || 'SCENTS & SOULS PERFUME LAB'} • {activeTab === 'products' ? 'INVENTORY HUB' : activeTab === 'batches' ? 'BATCH & EXPIRY CONTROL' : 'DEMAND VELOCITY & REORDER POINT PREDICTIONS'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          {/* Segmented Tab Switcher */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
            <button
              onClick={() => setActiveTab('products')}
              className={cn(
                "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'products' ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
              )}
            >
              <Package size={14} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={cn(
                "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'batches' ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
              )}
            >
              <FlaskConical size={14} />
              Batches & Expiry
            </button>
            <button
              onClick={() => setActiveTab('forecasting')}
              className={cn(
                "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'forecasting' ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
              )}
            >
              <TrendingUp size={14} />
              Forecasting
            </button>
          </div>

          {activeTab !== 'forecasting' && (
            <button 
              onClick={activeTab === 'products' ? handleAddNew : handleAddNewBatch}
              className="bg-[#0F0F0F] text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all w-full sm:w-auto shadow-[0_20px_40px_rgba(0,0,0,0.15)] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Plus size={20} strokeWidth={3} />
              {activeTab === 'products' ? 'REGISTER PRODUCT' : 'NEW BATCH'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                    <Package size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight">{isEditing ? 'RECALIBRATE' : 'NEW REGISTRY'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">{isEditing ? 'MODIFICATION SEQUENCE' : 'ADVANCED DEVICE ENTRY'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-12 h-12 hover:bg-gray-50 rounded-2xl transition-all text-gray-300 hover:text-black flex items-center justify-center"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-12 no-scrollbar">
                <div className="flex flex-col lg:flex-row gap-12">
                  {/* Image & Display Section */}
                  <div className="lg:w-72 space-y-8">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-black">Device View</h3>
                     </div>
                     <div className="aspect-square bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative group overflow-hidden">
                        {newProduct.image ? (
                          <>
                            <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                               <button 
                                 type="button"
                                 onClick={() => setNewProduct(prev => ({ ...prev, image: '' }))}
                                 className="bg-white/20 hover:bg-white/40 p-4 rounded-full text-white backdrop-blur-xl transition-all"
                               >
                                 <Trash2 size={24} />
                               </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <Camera size={40} className="text-gray-300" />
                            <p className="text-[9px] font-black text-gray-400 mt-4 uppercase tracking-widest">Awaiting Capture</p>
                          </>
                        )}
                        <label className="absolute inset-0 cursor-pointer">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".png,.jpg,.jpeg,.bmp" 
                            onChange={handleImageUpload} 
                          />
                        </label>
                     </div>
                     <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Protocol Support</div>
                        <p className="text-[10px] text-gray-500 mt-2 font-medium leading-relaxed">
                          Max size: 1MB. Use high-resolution PNG, JPG, or BMP for optimal node identification.
                        </p>
                     </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Basic Info Section */}
                    <div className="space-y-10">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                       <h3 className="text-sm font-black uppercase tracking-widest text-black">Device Definitions</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Universal Name</label>
                        <input 
                          type="text" 
                          required
                          value={newProduct.name}
                          onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                          placeholder="e.g. IPHONE 15 PRO MAX"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category Protocol</label>
                        <select 
                          value={newProduct.category}
                          onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">SKU PROTOCOL</label>
                          <input 
                            type="text" 
                            required
                            value={newProduct.sku}
                            onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                            className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm uppercase"
                            placeholder="IP15-P-T"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Brand Hub</label>
                          <input 
                            type="text" 
                            value={newProduct.brand}
                            onChange={e => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                            className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                            placeholder="APPLE / SAMSUNG"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Condition Protocol</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(ProductType).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewProduct(prev => ({ ...prev, type }))}
                              className={cn(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                newProduct.type === type 
                                  ? "bg-black text-white border-black" 
                                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center justify-between">
                           BARCODE / SERIAL IDENTIFIER
                           <button 
                             type="button" 
                             onClick={handleGenerateBarcode}
                             className="text-black hover:underline flex items-center gap-2 normal-case font-black text-[9px] tracking-widest uppercase"
                           >
                             <RefreshCw size={12} /> RE-GENERATE
                           </button>
                         </label>
                         <div className="relative">
                           <Barcode className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                           <input 
                             type="text" 
                             value={newProduct.barcode}
                             onChange={e => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                             className="w-full pl-16 pr-16 py-5 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm"
                             placeholder="SCAN INPUT..."
                           />
                           <button
                             type="button"
                             onClick={() => setShowBarcodeScanner(true)}
                             className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100/50 rounded-xl transition-all cursor-pointer text-gray-400 hover:text-black flex items-center justify-center"
                             title="Camera Scan Barcode"
                           >
                             <ScanBarcode size={20} />
                           </button>
                         </div>
                         
                         {newProduct.barcode && (
                           <div className="bg-gray-50/50 p-6 rounded-3xl flex flex-col items-center justify-center border border-dashed border-gray-200">
                             <BarcodeDisplay value={newProduct.barcode} width={1.8} height={50} fontSize={10} background="transparent" />
                           </div>
                         )}
                      </div>
                    </div>
                  </div>

                       {/* Scent Molecular Profiling */}
                       <div className="mt-10 pt-10 border-t-2 border-dashed border-gray-100 space-y-8">
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                             <h3 className="text-sm font-black uppercase tracking-widest text-black">Scent Molecular Profile</h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Scent Family Accord</label>
                                <select 
                                  value={newProduct.scentFamily || ''}
                                  onChange={e => setNewProduct(prev => ({ ...prev, scentFamily: e.target.value }))}
                                  className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                                >
                                  <option value="">Select Scent Family...</option>
                                  <option value="Oud & Oriental">Oud & Oriental</option>
                                  <option value="Woody & Spicy">Woody & Spicy</option>
                                  <option value="Floral & Sweet">Floral & Sweet</option>
                                  <option value="Citrus & Fresh">Citrus & Fresh</option>
                                  <option value="Musk & Amber">Musk & Amber</option>
                                  <option value="Gourmand & Warm">Gourmand & Warm</option>
                                  <option value="Leather & Fougère">Leather & Fougère</option>
                                </select>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Concentration Formula</label>
                                <select 
                                  value={newProduct.concentration || ''}
                                  onChange={e => setNewProduct(prev => ({ ...prev, concentration: e.target.value }))}
                                  className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                                >
                                  <option value="">Select Concentration...</option>
                                  <option value="Extrait de Parfum (20-40%)">Extrait de Parfum (20-40%)</option>
                                  <option value="Eau de Parfum (EDP) (15-20%)">Eau de Parfum (EDP) (15-20%)</option>
                                  <option value="Eau de Toilette (EDT) (5-15%)">Eau de Toilette (EDT) (5-15%)</option>
                                  <option value="Eau de Cologne (EDC) (2-4%)">Eau de Cologne (EDC) (2-4%)</option>
                                  <option value="Concentrated Perfume Oil (Attar)">Concentrated Perfume Oil (Attar)</option>
                                </select>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-amber-600/80 ml-1 flex items-center gap-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                   Top Notes (Initial Impact)
                                </label>
                                <input 
                                  type="text" 
                                  value={newProduct.topNotes || ''}
                                  onChange={e => setNewProduct(prev => ({ ...prev, topNotes: e.target.value }))}
                                  className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                                  placeholder="e.g. Saffron, Lavender, Bergamot"
                                />
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-purple-600/80 ml-1 flex items-center gap-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                   Middle Notes (Heart Accord)
                                </label>
                                <input 
                                  type="text" 
                                  value={newProduct.middleNotes || ''}
                                  onChange={e => setNewProduct(prev => ({ ...prev, middleNotes: e.target.value }))}
                                  className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                                  placeholder="e.g. Oud wood, Bulgarian Rose, Jasmine"
                                />
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] ml-1 flex items-center gap-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                                   Base Notes (Long-lasting Depth)
                                </label>
                                <input 
                                  type="text" 
                                  value={newProduct.baseNotes || ''}
                                  onChange={e => setNewProduct(prev => ({ ...prev, baseNotes: e.target.value }))}
                                  className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                                  placeholder="e.g. Ambergris, Musk, Patchouli, Oakmoss"
                                />
                             </div>
                          </div>
                       </div>

                  {/* Financial Section */}
                  <div className="space-y-12">
                     <div className="space-y-10">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-black rounded-full" />
                           <h3 className="text-sm font-black uppercase tracking-widest text-black">Financial Metrics</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Unit Cost (AED)</label>
                            <input 
                              type="number" 
                              required
                              value={newProduct.costPrice}
                              onChange={e => setNewProduct(prev => ({ ...prev, costPrice: parseFloat(e.target.value) }))}
                              className="w-full px-6 py-5 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Market Price (AED)</label>
                            <input 
                              type="number" 
                              required
                              value={newProduct.sellingPrice}
                              onChange={e => setNewProduct(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) }))}
                              className="w-full px-6 py-5 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-xl"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Current Stock</label>
                              <input 
                                type="number" 
                                value={newProduct.stockQuantity}
                                onChange={e => setNewProduct(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Alert Threshold</label>
                              <input 
                                type="number" 
                                value={newProduct.minStockLevel}
                                onChange={e => setNewProduct(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) }))}
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black">BATCH CODE PROTOCOL</div>
                              <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Track individual batch/lot numbers</div>
                           </div>
                           <button 
                             type="button"
                             onClick={() => setNewProduct(prev => ({ ...prev, imeiRequired: !prev.imeiRequired }))}
                             className={cn(
                               "w-14 h-7 rounded-full transition-all relative border-2",
                               newProduct.imeiRequired ? "bg-black border-black" : "bg-white border-gray-200"
                             )}
                           >
                             <div className={cn(
                               "absolute top-1 w-4 h-4 rounded-full transition-all",
                               newProduct.imeiRequired ? "right-1 bg-white" : "left-1 bg-gray-200"
                             )} />
                           </button>
                        </div>
                        <div className="border-t-2 border-dashed border-gray-200 pt-6 flex items-center justify-between">
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Yield Margin</div>
                              <div className="text-xl font-black mt-1">
                                {newProduct.sellingPrice && newProduct.costPrice ? 
                                  `${(((newProduct.sellingPrice - newProduct.costPrice) / newProduct.sellingPrice) * 100).toFixed(1)}%` : 
                                  '0.0%'
                                }
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Profit</div>
                              <div className="text-xl font-black mt-1 text-green-600 tracking-tighter">
                                {newProduct.sellingPrice && newProduct.costPrice ? 
                                  formatCurrency(newProduct.sellingPrice - newProduct.costPrice) : 
                                  formatCurrency(0)
                                }
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
                
                <div className="mt-16 flex items-center gap-6 sticky bottom-0 bg-white pb-4 pt-10 border-t border-gray-50">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-5 px-8 border-2 border-gray-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-400"
                  >
                    ABORT Registry
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 px-8 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-black/20"
                  >
                    <Save size={18} strokeWidth={3} />
                    {isEditing ? 'COMMIT MODIFICATION' : 'AUTHORIZE REGISTRY ENTRY'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showShelfTalkerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShelfTalkerModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-6xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#C5A059] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                    <QrCode size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight">SHELF-TALKER STATION</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">PRINTABLE LABELS & INTERACTIVE QR GENERATOR</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShelfTalkerModal(false)}
                  className="w-12 h-12 hover:bg-gray-50 rounded-2xl transition-all text-gray-300 hover:text-black flex items-center justify-center"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                
                {/* Left Side: Parameters & Selectors (Scrollable) */}
                <div className="lg:w-[450px] border-r border-gray-50 p-10 overflow-y-auto no-scrollbar space-y-8 flex flex-col justify-between">
                  <div className="space-y-8">
                    {/* Size & Layout configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#C5A059] rounded-full" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-black">1. Label Parameters</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Visual Theme</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'luxury-dark', label: 'Luxury Dark' },
                            { id: 'minimalist-light', label: 'Minimalist' },
                            { id: 'boutique-gold', label: 'Boutique Gold' }
                          ].map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setShelfTalkerTheme(t.id as any)}
                              className={cn(
                                "py-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                shelfTalkerTheme === t.id 
                                  ? "bg-black text-white border-black" 
                                  : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200"
                              )}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Card Size</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'standard', label: 'Std (3.5x4")' },
                            { id: 'large', label: 'Lrg (4x5")' },
                            { id: 'compact', label: 'Cpt (3x3")' }
                          ].map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setShelfTalkerSize(s.id as any)}
                              className={cn(
                                "py-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                shelfTalkerSize === s.id 
                                  ? "bg-black text-white border-black" 
                                  : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200"
                              )}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-2 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={shelfTalkerIncludeNotes}
                            onChange={e => setShelfTalkerIncludeNotes(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Include Fragrance Notes</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={shelfTalkerIncludeQrCode}
                            onChange={e => setShelfTalkerIncludeQrCode(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Include 3D QR Code</span>
                        </label>
                      </div>
                    </div>

                    {/* Products Multi-Selector */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-[#C5A059] rounded-full" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-black">2. Select Perfumes</h4>
                        </div>
                        <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest">
                          <button 
                            type="button"
                            onClick={() => setSelectedProductsForShelf(products.map(p => p.id || ''))}
                            className="text-[#C5A059] hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-gray-200">|</span>
                          <button 
                            type="button"
                            onClick={() => setSelectedProductsForShelf([])}
                            className="text-gray-400 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Product list with quick search/filters */}
                      <div className="border border-gray-100 rounded-2xl max-h-[220px] overflow-y-auto p-4 space-y-2 bg-gray-50/50">
                        {products.map(p => {
                          const isChecked = selectedProductsForShelf.includes(p.id || '');
                          return (
                            <label 
                              key={p.id}
                              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 cursor-pointer select-none transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedProductsForShelf(prev => prev.filter(id => id !== p.id));
                                    } else {
                                      setSelectedProductsForShelf(prev => [...prev, p.id || '']);
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="text-[10px] font-black uppercase tracking-tight text-gray-900 truncate max-w-[200px]">
                                    {p.name}
                                  </div>
                                  <div className="text-[8px] text-gray-400 font-mono mt-0.5">{p.sku}</div>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                                {formatCurrency(p.sellingPrice)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Trigger Print Button */}
                  <div className="pt-8 border-t border-gray-50 mt-8">
                    <button
                      type="button"
                      onClick={() => handlePrintShelfTalkers()}
                      disabled={selectedProductsForShelf.length === 0}
                      className="w-full py-5 bg-black text-white hover:bg-zinc-800 disabled:bg-gray-100 disabled:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer"
                    >
                      <Download size={16} />
                      PRINT {selectedProductsForShelf.length} SHELF-TALKERS
                    </button>
                    <p className="text-[8px] text-gray-400 text-center uppercase tracking-widest mt-3 font-bold">
                      Ensure paper size is A4 or Letter, background graphics are enabled in print settings.
                    </p>
                  </div>
                </div>

                {/* Right Side: Immersive Canvas Live Sheets Preview (Scrollable) */}
                <div className="flex-1 bg-zinc-950 p-10 overflow-y-auto flex flex-col items-center justify-start min-h-[400px]">
                  <div className="w-full max-w-xl mb-4 flex items-center justify-between text-zinc-500">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">SHELF PREVIEW MATRIX (REALTIME SCALE)</span>
                    <span className="text-[8px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {selectedProductsForShelf.length} ACTIVE BOTTLES
                    </span>
                  </div>

                  {selectedProductsForShelf.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-[2rem] w-full py-24">
                      <QrCode size={48} className="text-zinc-800 mb-4 animate-pulse" />
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-center leading-relaxed">
                        AWAITING PRODUCT NODES<br />
                        <span className="text-[8px] text-zinc-700 font-normal">Check products in the selector to populate talker labels</span>
                      </p>
                    </div>
                  ) : (
                    <div className="w-full flex justify-center bg-white border border-zinc-800 rounded-[2rem] p-8 shadow-2xl scale-95 origin-top">
                      {/* Interactive Sheet Preview */}
                      <PrintShelfTalkers
                        products={products.filter(p => selectedProductsForShelf.includes(p.id || ''))}
                        includeNotes={shelfTalkerIncludeNotes}
                        includeQrCode={shelfTalkerIncludeQrCode}
                        themeStyle={shelfTalkerTheme}
                        labelSize={shelfTalkerSize}
                      />
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}

        {showQrModal && selectedProductForQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#C5A059] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                    <QrCode size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight">FAST CHECKOUT QR STATION</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">PRODUCT CHECKOUT QR CODE & LABEL ENGINE</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQrModal(false)}
                  className="w-12 h-12 hover:bg-gray-50 rounded-2xl transition-all text-gray-300 hover:text-black flex items-center justify-center cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Left controls panel */}
                <div className="w-full lg:w-96 border-r border-gray-50 p-10 overflow-y-auto space-y-8">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">PRODUCT CLUSTER</span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-black mt-2 leading-tight">
                      {selectedProductForQr.name}
                    </h3>
                    <p className="text-[10px] text-[#C5A059] font-black uppercase tracking-widest mt-1">
                      {selectedProductForQr.brand || 'BESPOKE LAB'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block">LABEL SIZE LAYOUT</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'compact', name: 'COMPACT LABEL (40x40mm)', desc: 'Optimized for small vials & perfume bottles' },
                        { id: 'standard', name: 'STANDARD LABEL (60x60mm)', desc: 'Standard retail layout with brand, price, & barcode' },
                        { id: 'detailed', name: 'DETAILED COMPOSITE (80x80mm)', desc: 'Full profile including olfactory scent notes' }
                      ].map(sz => (
                        <button
                          key={sz.id}
                          onClick={() => setQrLabelSize(sz.id as any)}
                          className={cn(
                            "p-4 rounded-2xl text-left border-2 transition-all cursor-pointer active:scale-98",
                            qrLabelSize === sz.id 
                              ? "border-black bg-black text-white" 
                              : "border-gray-100 hover:border-gray-300 text-gray-500 hover:text-black"
                          )}
                        >
                          <div className="text-[10px] font-black uppercase tracking-wider">{sz.name}</div>
                          <div className={cn("text-[9px] mt-1", qrLabelSize === sz.id ? "text-gray-300 font-medium" : "text-gray-400")}>{sz.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block">COPIES TO GENERATE</label>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setQrCount(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 border border-gray-100 rounded-xl hover:border-black flex items-center justify-center font-bold text-lg active:scale-90 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-black font-mono w-12 text-center">{qrCount}</span>
                      <button 
                        onClick={() => setQrCount(prev => Math.min(24, prev + 1))}
                        className="w-10 h-10 border border-gray-100 rounded-xl hover:border-black flex items-center justify-center font-bold text-lg active:scale-90 cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">MAX 24 COPIES</span>
                    </div>
                  </div>

                  <div className="p-5 bg-amber-50/50 border border-amber-100/50 rounded-2xl text-amber-800 text-[9px] font-bold leading-normal uppercase tracking-wider">
                    ⚡ POS INTEGRATION TRACE:<br />
                    Scanning this unique QR code in the POS checkout screen immediately filters and registers this product to the active cart for frictionless customer checkouts.
                  </div>

                  <button
                    onClick={() => handlePrintQrCode()}
                    className="w-full py-5 bg-[#C5A059] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#B38E49] transition-all cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-3 active:scale-95"
                  >
                    PRINT LABELS NOW
                  </button>
                </div>

                {/* Right live interactive print preview */}
                <div className="flex-1 bg-gray-50/50 p-10 overflow-y-auto flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-6 text-center">LIVE CARD RENDER PREVIEW</span>
                    <div 
                      className="border border-dashed border-gray-300 p-6 flex flex-col items-center text-center justify-between mx-auto shadow-xl"
                      style={{
                        width: qrLabelSize === 'compact' ? '200px' : qrLabelSize === 'standard' ? '250px' : '300px',
                        minHeight: qrLabelSize === 'compact' ? '200px' : qrLabelSize === 'standard' ? '250px' : '300px',
                        backgroundColor: 'white',
                        borderRadius: '24px'
                      }}
                    >
                      <div className="w-full">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] block text-gray-400">
                          {profile?.companyName || 'SCENTS & SOULS'}
                        </span>
                        <span className="text-[7px] font-bold tracking-widest uppercase block text-amber-700 mt-1">
                          {selectedProductForQr.brand || 'Bespoke Lab'}
                        </span>
                        <h3 className="text-xs font-black uppercase tracking-tight leading-tight mt-1 truncate w-full text-black">
                          {selectedProductForQr.name}
                        </h3>
                      </div>

                      <div className="my-4 p-2 bg-white border border-gray-100 rounded-2xl shadow-inner animate-pulse">
                        <QRCode
                          value={selectedProductForQr.barcode || selectedProductForQr.sku || selectedProductForQr.id || ''}
                          size={qrLabelSize === 'compact' ? 80 : qrLabelSize === 'standard' ? 110 : 140}
                          style={{ height: 'auto', width: qrLabelSize === 'compact' ? 80 : qrLabelSize === 'standard' ? 110 : 140 }}
                          level="M"
                        />
                      </div>

                      <div className="w-full text-center">
                        <div className="text-xs font-black font-display text-black">
                          {formatCurrency(selectedProductForQr.sellingPrice)}
                        </div>
                        <div className="text-[8px] font-mono text-gray-400 font-bold mt-1 tracking-widest text-black">
                          {selectedProductForQr.barcode || selectedProductForQr.sku}
                        </div>
                        
                        {qrLabelSize === 'detailed' && (selectedProductForQr.scentFamily || selectedProductForQr.topNotes) && (
                          <div className="mt-2 pt-2 border-t border-gray-50 text-[8px] text-gray-400 font-bold leading-normal text-left">
                            {selectedProductForQr.scentFamily && <div className="uppercase font-black text-amber-700 mb-0.5">{selectedProductForQr.scentFamily}</div>}
                            {selectedProductForQr.topNotes && <div className="truncate">TOP: {selectedProductForQr.topNotes}</div>}
                            {selectedProductForQr.middleNotes && <div className="truncate">MID: {selectedProductForQr.middleNotes}</div>}
                            {selectedProductForQr.baseNotes && <div className="truncate">BASE: {selectedProductForQr.baseNotes}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden printing target container */}
      <div className="hidden">
        <div ref={shelfPrintRef}>
          <PrintShelfTalkers
            products={products.filter(p => selectedProductsForShelf.includes(p.id || ''))}
            includeNotes={shelfTalkerIncludeNotes}
            includeQrCode={shelfTalkerIncludeQrCode}
            themeStyle={shelfTalkerTheme}
            labelSize={shelfTalkerSize}
          />
        </div>
        <div ref={qrPrintRef}>
          {selectedProductForQr && (
            <div className="print-qr-labels-wrapper p-4 bg-white text-black" style={{ fontFamily: 'monospace' }}>
              <style>{`
                @media print {
                  .print-qr-labels-wrapper {
                    padding: 0 !important;
                    margin: 0 !important;
                    background: white !important;
                  }
                  .qr-label-card {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                  }
                }
              `}</style>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: qrCount }).map((_, index) => (
                  <div 
                    key={index} 
                    className="qr-label-card border border-dashed border-gray-300 p-4 flex flex-col items-center text-center justify-between"
                    style={{
                      width: qrLabelSize === 'compact' ? '40mm' : qrLabelSize === 'standard' ? '60mm' : '80mm',
                      minHeight: qrLabelSize === 'compact' ? '40mm' : qrLabelSize === 'standard' ? '60mm' : '80mm',
                      margin: 'auto',
                      backgroundColor: 'white',
                      color: 'black'
                    }}
                  >
                    <div className="w-full">
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] block text-gray-500">
                        {profile?.companyName || 'SCENTS & SOULS'}
                      </span>
                      <span className="text-[6px] font-bold tracking-widest uppercase block text-amber-700 mt-0.5">
                        {selectedProductForQr.brand || 'Bespoke Lab'}
                      </span>
                      <h3 className="text-[10px] font-black uppercase tracking-tight leading-tight mt-1 truncate w-full">
                        {selectedProductForQr.name}
                      </h3>
                    </div>

                    <div className="my-2 p-1.5 bg-white border border-gray-100 rounded inline-block">
                      <QRCode
                        value={selectedProductForQr.barcode || selectedProductForQr.sku || selectedProductForQr.id || ''}
                        size={qrLabelSize === 'compact' ? 50 : qrLabelSize === 'standard' ? 75 : 100}
                        style={{ height: 'auto', width: qrLabelSize === 'compact' ? 50 : qrLabelSize === 'standard' ? 75 : 100 }}
                        level="M"
                      />
                    </div>

                    <div className="w-full text-center">
                      <div className="text-[9px] font-black font-display text-black">
                        {formatCurrency(selectedProductForQr.sellingPrice)}
                      </div>
                      <div className="text-[7px] font-mono text-gray-500 font-bold mt-1 tracking-wider">
                        {selectedProductForQr.barcode || selectedProductForQr.sku}
                      </div>
                      
                      {qrLabelSize === 'detailed' && (selectedProductForQr.scentFamily || selectedProductForQr.topNotes) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-[6px] text-gray-400 font-bold leading-normal">
                          {selectedProductForQr.scentFamily && <div className="uppercase font-black text-amber-700 mb-0.5">{selectedProductForQr.scentFamily}</div>}
                          {selectedProductForQr.topNotes && <div className="truncate">TOP: {selectedProductForQr.topNotes}</div>}
                          {selectedProductForQr.middleNotes && <div className="truncate">MID: {selectedProductForQr.middleNotes}</div>}
                          {selectedProductForQr.baseNotes && <div className="truncate">BASE: {selectedProductForQr.baseNotes}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="advanced-3d-card overflow-hidden bg-white">
        <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
            <input 
              type="text" 
              placeholder="FILTER DATA CLUSTERS (NAME, SKU, UID)..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-24 py-5 text-xs font-black uppercase tracking-tight bg-gray-50/50 border-transparent rounded-3xl shadow-inner focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-200"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 hover:bg-gray-200/50 rounded-full text-gray-400 hover:text-black transition-all cursor-pointer"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleVoiceSearch('products')}
                className={cn(
                  "p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center relative",
                  isListening && listeningTarget === 'products'
                    ? "bg-red-500 text-white animate-pulse"
                    : "hover:bg-gray-100 text-gray-400 hover:text-black"
                )}
                title={isListening && listeningTarget === 'products' ? "Listening... Click to stop" : "Voice search"}
              >
                {isListening && listeningTarget === 'products' ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                type="button"
                onClick={() => setShowBarcodeScanner(true)}
                className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-black transition-all cursor-pointer flex items-center justify-center"
                title="Camera Barcode Scanner"
              >
                <ScanBarcode size={18} />
              </button>
            </div>
            {voiceFeedback && listeningTarget === 'products' && (
              <div className="absolute left-5 -bottom-7 text-[10px] font-black uppercase tracking-wider text-amber-600 animate-fadeIn flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100/50 z-10 shadow-sm">
                <span className={cn("w-1.5 h-1.5 rounded-full bg-amber-500", isListening && "animate-ping")} />
                {voiceFeedback}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select 
                value={selectedBrand} 
                onChange={e => setSelectedBrand(e.target.value)}
                className="px-6 py-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-100 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all pr-10 appearance-none font-mono"
              >
                <option value="All Brands">ALL BRANDS</option>
                {BRANDS.map(brand => (
                  <option key={brand} value={brand}>{brand.toUpperCase()}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Filter size={12} />
              </div>
            </div>

            <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-100">
               <button 
                 onClick={() => setFilterMode('all')}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   filterMode === 'all' ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
                 )}
               >ALL</button>
               <button 
                 onClick={() => setFilterMode('low')}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   filterMode === 'low' ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "text-gray-400 hover:text-orange-500"
                 )}
               >LOW</button>
            </div>
             <button 
              onClick={() => {
                setSelectedProductsForShelf(products.map(p => p.id || ''));
                setShowShelfTalkerModal(true);
              }}
              className="px-6 py-3.5 bg-[#C5A059] text-white hover:bg-[#B38F48] rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
              title="GENERATE RETAIL SHELF-TALKERS"
            >
              <QrCode size={14} /> SHELF-TALKERS
            </button>

             <button 
              onClick={() => setShowImportModal(true)}
              className="px-5 py-3.5 bg-black hover:bg-neutral-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
              title="BULK UPLOAD STOCK (CSV)"
            >
              <Upload size={14} /> BULK UPLOAD
            </button>

            <button 
              onClick={handleExportCSV}
              className="w-14 h-14 flex items-center justify-center text-gray-300 hover:text-black hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 active:scale-95"
              title="EXPORT CSV"
            >
              <Download size={24} />
            </button>
            <div className="w-[1px] h-10 bg-gray-100 mx-2" />
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
               {filteredProducts.length} NODES IDENTIFIED
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">IDENTIFIER & TYPE</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">NODE STATUS</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">UNIT COST</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">SELLING PRICE</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">CATEGORY HUB</th>
                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 group-hover:scale-110 transition-transform overflow-hidden p-1">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain rounded-xl" />
                        ) : (
                          <Package size={28} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black flex items-center gap-3 uppercase tracking-tighter">
                          {p.name}
                          <span className={cn(
                            "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                            p.type === ProductType.NEW ? "bg-green-500 text-white" :
                            p.type === ProductType.USED ? "bg-blue-500 text-white" :
                            p.type === ProductType.REPAIR ? "bg-orange-500 text-white" : "bg-gray-400 text-white"
                          )}>
                            {p.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 tracking-[0.2em] font-mono font-bold uppercase">{p.sku}</div>

                        {(p.scentFamily || p.concentration) && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {p.scentFamily && (
                              <span className="text-[8px] px-2.5 py-1 bg-amber-50 text-[#C5A059] border border-amber-100 rounded-lg font-black uppercase tracking-widest">
                                {p.scentFamily}
                              </span>
                            )}
                            {p.concentration && (
                              <span className="text-[8px] px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-100 rounded-lg font-black uppercase tracking-widest">
                                {p.concentration.replace(/\s*\(.*\)/, '')}
                              </span>
                            )}
                          </div>
                        )}

                        {(p.topNotes || p.middleNotes || p.baseNotes) && (
                          <div className="text-[9px] text-gray-400 mt-1.5 flex items-center gap-1 font-bold">
                            <span className="text-[#C5A059] font-black uppercase tracking-widest text-[8px] bg-[#C5A059]/10 px-1 py-0.5 rounded">Notes</span>
                            <span className="truncate max-w-[200px]" title={[p.topNotes, p.middleNotes, p.baseNotes].filter(Boolean).join(' • ')}>
                              {[p.topNotes, p.middleNotes, p.baseNotes].filter(Boolean).join(' • ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black">{p.stockQuantity}</div>
                      {p.stockQuantity <= p.minStockLevel && (
                        <div className="flex items-center gap-2 text-[8px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 uppercase tracking-widest">
                          <AlertTriangle size={12} />
                          CRITICAL
                        </div>
                      )}
                    </div>
                    <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          p.stockQuantity <= p.minStockLevel ? "bg-orange-500" : "bg-black"
                        )}
                        style={{ width: `${Math.min((p.stockQuantity / (p.minStockLevel * 4)) * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-lg font-bold text-gray-400 font-display tracking-tighter">
                      {formatCurrency(p.costPrice || 0)}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-xl font-black font-display tracking-tighter">
                      {formatCurrency(p.sellingPrice)}
                    </div>
                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1">VAT INC. (5%)</p>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-100">
                       {p.category}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => {
                          setSelectedProductForQr(p);
                          setQrCount(1);
                          setShowQrModal(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#C5A059] hover:bg-amber-50 rounded-xl transition-all"
                        title="GENERATE CHECKOUT QR CODE"
                      >
                        <QrCode size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(p)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-xl transition-all shadow-sm"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
                        {loading && [1,2,3,4,5].map(i => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={6} className="px-10 py-10 border-b border-gray-50 bg-gray-50/10" />
                          </tr>
                        ))}
                        {!loading && filteredProducts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-10 py-24 text-center">
                              <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                                 <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
                                   <Package size={32} strokeWidth={1.5} />
                                 </div>
                                 <div>
                                   <p className="font-black uppercase tracking-widest text-[11px] text-gray-800">No Perfumes in Stock</p>
                                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 leading-relaxed">
                                     Initialize your luxury boutique with ready-to-print premium fragrance shelf-talkers & 3D profiles.
                                   </p>
                                 </div>
                                 <button
                                   type="button"
                                   disabled={seeding}
                                   onClick={handleSeedDemoData}
                                   className="px-8 py-3.5 bg-[#C5A059] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#B38E49] disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-amber-500/10 flex items-center gap-3 active:scale-95 mx-auto"
                                 >
                                   {seeding ? (
                                     <>
                                       <RefreshCw size={14} className="animate-spin" />
                                       Seeding Library...
                                     </>
                                   ) : (
                                     'Infuse Demo Scent Library'
                                   )}
                                 </button>
                              </div>
                            </td>
                          </tr>
                        )}
            </tbody>
          </table>
        </div>

        <div className="p-10 border-t border-gray-50 flex items-center justify-between bg-gray-50/10">
          <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
            NODE_SEQUENCE_RANGE [ 1 - {filteredProducts.length} ] OF {products.length} IDENTIFIERS
          </div>
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center border border-gray-100 rounded-2xl text-gray-300 hover:text-black hover:bg-white transition-all shadow-sm">
              <ChevronLeft size={24} />
            </button>
            <div className="flex gap-2">
               <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black text-white text-[10px] font-black shadow-xl shadow-black/20">01</button>
               <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 text-[10px] font-black hover:text-black transition-all">02</button>
            </div>
            <button className="w-12 h-12 flex items-center justify-center border border-gray-100 rounded-2xl text-gray-300 hover:text-black hover:bg-white transition-all shadow-sm">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
      ) : activeTab === 'batches' ? (
        <div className="space-y-12">
          {/* 1. KPI Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            <div className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Batches</p>
                <h3 className="text-4xl font-black font-display tracking-tight mt-2">{batchStats.active}</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">In healthy rotation</p>
              </div>
              <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-800">
                <Database size={24} />
              </div>
            </div>

            <div className={cn(
              "p-8 rounded-[2rem] shadow-sm border flex items-center justify-between transition-all",
              batchStats.nearExpiry > 0 
                ? "bg-amber-50/50 border-amber-200 text-amber-900 shadow-md shadow-amber-500/5 animate-pulse" 
                : "bg-white border-gray-100 text-black"
            )}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Near Expiration</p>
                <h3 className="text-4xl font-black font-display tracking-tight mt-2 flex items-center gap-2">
                  {batchStats.nearExpiry}
                  {batchStats.nearExpiry > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </h3>
                <p className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-70">
                  {batchStats.nearExpiry > 0 ? "Expiring within 90 days!" : "No warnings detected"}
                </p>
              </div>
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border",
                batchStats.nearExpiry > 0 ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-gray-50 border-gray-100 text-gray-500"
              )}>
                <Clock size={24} />
              </div>
            </div>

            <div className={cn(
              "p-8 rounded-[2rem] shadow-sm border flex items-center justify-between transition-all",
              batchStats.expired > 0 
                ? "bg-red-50/50 border-red-200 text-red-900 shadow-md shadow-red-500/5 animate-pulse" 
                : "bg-white border-gray-100 text-black"
            )}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">EXPIRED BATCHES</p>
                <h3 className="text-4xl font-black font-display tracking-tight mt-2 flex items-center gap-2">
                  {batchStats.expired}
                  {batchStats.expired > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  )}
                </h3>
                <p className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-70">
                  {batchStats.expired > 0 ? "Immediate disposal required!" : "All quality assured"}
                </p>
              </div>
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border",
                batchStats.expired > 0 ? "bg-red-100 border-red-200 text-red-700" : "bg-gray-50 border-gray-100 text-gray-500"
              )}>
                <ShieldAlert size={24} />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Raw Volume</p>
                <h3 className="text-4xl font-black font-display tracking-tight mt-2">
                  {batchStats.totalMl.toLocaleString()} <span className="text-sm font-black uppercase text-gray-400">ml</span>
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Oils & Bases combined</p>
              </div>
              <div className="w-14 h-14 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-2xl flex items-center justify-center text-[#C5A059]">
                <FlaskConical size={24} />
              </div>
            </div>
          </div>

          {/* 2. List & Controls */}
          <div className="advanced-3d-card overflow-hidden bg-white">
            <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                <input 
                  type="text" 
                  placeholder="SEARCH BATCHES (BATCH CODE, NAME, STORAGE)..." 
                  value={batchSearchQuery}
                  onChange={e => setBatchSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-24 py-5 text-xs font-black uppercase tracking-tight bg-gray-50/50 border-transparent rounded-3xl shadow-inner focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-200"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {batchSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBatchSearchQuery('')}
                      className="p-1.5 hover:bg-gray-200/50 rounded-full text-gray-400 hover:text-black transition-all cursor-pointer"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleVoiceSearch('batches')}
                    className={cn(
                      "p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center relative",
                      isListening && listeningTarget === 'batches'
                        ? "bg-red-500 text-white animate-pulse"
                        : "hover:bg-gray-100 text-gray-400 hover:text-black"
                    )}
                    title={isListening && listeningTarget === 'batches' ? "Listening... Click to stop" : "Voice search"}
                  >
                    {isListening && listeningTarget === 'batches' ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-black transition-all cursor-pointer flex items-center justify-center"
                    title="Camera Barcode Scanner"
                  >
                    <ScanBarcode size={18} />
                  </button>
                </div>
                {voiceFeedback && listeningTarget === 'batches' && (
                  <div className="absolute left-5 -bottom-7 text-[10px] font-black uppercase tracking-wider text-amber-600 animate-fadeIn flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100/50 z-10 shadow-sm">
                    <span className={cn("w-1.5 h-1.5 rounded-full bg-amber-500", isListening && "animate-ping")} />
                    {voiceFeedback}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Carrier Type Filter */}
                <div className="relative">
                  <select 
                    value={batchCarrierFilter} 
                    onChange={e => setBatchCarrierFilter(e.target.value)}
                    className="px-6 py-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-100 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all pr-10 appearance-none font-mono"
                  >
                    <option value="all">ALL INGREDIENT BASES</option>
                    <option value="oil_base">PERFUME OIL (ATTAR)</option>
                    <option value="alcohol_base">ALCOHOL BASE</option>
                    <option value="mixed_fragrance">MIXED FORMULATION</option>
                    <option value="other">OTHER CARRIERS</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Filter size={12} />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select 
                    value={batchStatusFilter} 
                    onChange={e => setBatchStatusFilter(e.target.value)}
                    className="px-6 py-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-100 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all pr-10 appearance-none font-mono"
                  >
                    <option value="all">ALL ROTATION STATUSES</option>
                    <option value="active">ACTIVE / STABLE</option>
                    <option value="near-expiry">NEARING EXPIRATION</option>
                    <option value="expired">EXPIRED / AUDIT</option>
                    <option value="depleted">DEPLETED</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Filter size={12} />
                  </div>
                </div>
              </div>
            </div>

            {/* Table or Empty Seeder */}
            {batchesLoading ? (
              <div className="p-20 text-center animate-pulse">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Retrieving Batch Ledger...</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="px-10 py-24 text-center">
                <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
                    <FlaskConical size={32} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-widest text-[11px] text-gray-800">No Raw Batches Tracked</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 leading-relaxed">
                      Track manufacture lots, raw ethanol bases, high-concentration perfume oils, and shelf life to enforce UAE health protocols.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleAddNewBatch}
                      className="px-6 py-3.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 active:scale-95"
                    >
                      <Plus size={14} /> New Batch Lot
                    </button>
                    {batches.length === 0 && (
                      <button
                        type="button"
                        disabled={seedingBatches}
                        onClick={handleSeedDemoBatches}
                        className="px-6 py-3.5 bg-[#C5A059] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#B38E49] disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-amber-500/5"
                      >
                        {seedingBatches ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Seeding...
                          </>
                        ) : (
                          <>
                            <Database size={14} /> Infuse Demo Batches
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">BATCH LOT CODE & SOURCE</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">CARRIER TYPE</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">VOLUMETRIC LEVEL</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">SHELF-LIFE EXPIRY STATUS</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">LOCATION SLOT</th>
                      <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBatches.map((b) => {
                      const status = getBatchStatus(b.expiryDate, b.remainingQuantityMl);
                      const exp = new Date(b.expiryDate);
                      const today = new Date();
                      const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={b.id} className="hover:bg-gray-50/30 transition-colors group">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                                <FlaskConical size={24} />
                              </div>
                              <div>
                                <div className="text-sm font-black flex items-center gap-3 uppercase tracking-tighter">
                                  {b.batchNumber}
                                  {b.sku && (
                                    <span className="text-[8px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded font-mono font-bold">
                                      {b.sku}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                  {b.productName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            {b.carrierType === 'oil_base' && (
                              <span className="text-[8px] px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-black uppercase tracking-widest">
                                PERFUME OIL BASE
                              </span>
                            )}
                            {b.carrierType === 'alcohol_base' && (
                              <span className="text-[8px] px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-black uppercase tracking-widest">
                                ALCOHOL BASE
                              </span>
                            )}
                            {b.carrierType === 'mixed_fragrance' && (
                              <span className="text-[8px] px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg font-black uppercase tracking-widest">
                                MIXED FRAGRANCE
                              </span>
                            )}
                            {b.carrierType === 'other' && (
                              <span className="text-[8px] px-2.5 py-1 bg-gray-50 text-gray-700 border border-gray-100 rounded-lg font-black uppercase tracking-widest">
                                OTHER MEDIUM
                              </span>
                            )}
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-black text-gray-900">
                                {b.remainingQuantityMl} <span className="text-xs text-gray-400 font-normal">/ {b.initialQuantityMl} ml</span>
                              </div>
                              {b.remainingQuantityMl <= 100 && (
                                <span className="text-[8px] px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full font-black uppercase tracking-widest">
                                  CRITICAL LEVEL
                                </span>
                              )}
                            </div>
                            <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden shadow-inner">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  b.remainingQuantityMl <= 100 ? "bg-orange-500" : "bg-[#C5A059]"
                                )}
                                style={{ width: `${Math.min((b.remainingQuantityMl / b.initialQuantityMl) * 100, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="space-y-1.5">
                              {status === 'expired' && (
                                <span className="text-[8px] px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg font-black uppercase tracking-widest inline-flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  EXPIRED ({Math.abs(daysLeft)} DAYS AGO)
                                </span>
                              )}
                              {status === 'near-expiry' && (
                                <span className="text-[8px] px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-black uppercase tracking-widest inline-flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  NEAR EXPIRY ({daysLeft} DAYS LEFT)
                                </span>
                              )}
                              {status === 'active' && (
                                <span className="text-[8px] px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg font-black uppercase tracking-widest inline-flex items-center gap-1">
                                  <CheckCircle2 size={10} />
                                  STABLE ({daysLeft} DAYS LEFT)
                                </span>
                              )}
                              {status === 'depleted' && (
                                <span className="text-[8px] px-2.5 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg font-black uppercase tracking-widest inline-flex items-center gap-1">
                                  DEPLETED
                                </span>
                              )}
                              <div className="text-[10px] text-gray-400 font-mono font-bold uppercase">
                                EXPIRY: {b.expiryDate}
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-2 text-xs font-black text-gray-700">
                              <MapPin size={12} className="text-gray-400" />
                              {b.locationSlot || 'NOT ASSIGNED'}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-1 truncate max-w-[150px]">
                              {b.notes || 'No QC audit notes.'}
                            </div>
                          </td>
                          <td className="px-10 py-8 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setAdjustingBatchId(b.id || null);
                                  setAdjustAmount(50);
                                  setAdjustType('deduct');
                                }}
                                className="px-3 py-1.5 border border-gray-100 hover:border-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-all bg-white hover:bg-gray-50 active:scale-95 font-mono"
                                title="ADJUST VOLUME ML"
                              >
                                ADJUST ML
                              </button>
                              
                              <button 
                                onClick={() => handleEditBatch(b)}
                                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteBatch(b.id || '')}
                                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ForecastingModule products={products} sales={sales} />
      )}

      {/* Quick Volume Adjustment Modal */}
      <AnimatePresence>
        {adjustingBatchId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdjustingBatchId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-50 pb-6 mb-6">
                <div>
                  <h3 className="font-display text-xl font-black uppercase tracking-tight">Volumetric Adjustment</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                    Deduct for mixing, formulation or spillages
                  </p>
                </div>
                <button 
                  onClick={() => setAdjustingBatchId(null)}
                  className="w-10 h-10 hover:bg-gray-50 rounded-xl transition-all text-gray-300 hover:text-black flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-100">
                  <button
                    onClick={() => setAdjustType('deduct')}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      adjustType === 'deduct' ? "bg-black text-white" : "text-gray-400 hover:text-black"
                    )}
                  >
                    Deduct / Use ml
                  </button>
                  <button
                    onClick={() => setAdjustType('refill')}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      adjustType === 'refill' ? "bg-black text-white" : "text-gray-400 hover:text-black"
                    )}
                  >
                    Refill / Top up ml
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Volume Quantity (ml)</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustAmount || ''}
                    onChange={e => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-xl text-center"
                    placeholder="ENTER ML..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setAdjustingBatchId(null)}
                    className="flex-1 py-4 border-2 border-gray-50 rounded-xl font-black text-[9px] uppercase tracking-widest text-gray-400 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleQuickAdjustBatchVolume(adjustingBatchId, adjustAmount, adjustType)}
                    className="flex-1 py-4 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-800"
                  >
                    Apply Adjustment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Add/Edit Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBatchModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                    <FlaskConical size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight">
                      {isEditingBatch ? 'RECALIBRATE BATCH' : 'REGISTER RAW BATCH'}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">
                      {isEditingBatch ? 'LOT MODIFICATION SEQUENCE' : 'RAW SCENT MATERIAL ENROLMENT'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBatchModal(false)}
                  className="w-12 h-12 hover:bg-gray-50 rounded-2xl transition-all text-gray-300 hover:text-black flex items-center justify-center"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveBatch} className="flex-1 overflow-y-auto p-12 no-scrollbar space-y-8">
                {/* 1. Scent Material Linkage */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Scent Lot Association</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Associated Scent Product</label>
                      <select
                        value={newBatch.productId || ''}
                        required
                        onChange={e => {
                          const linked = products.find(p => p.id === e.target.value);
                          setNewBatch(prev => ({
                            ...prev,
                            productId: e.target.value,
                            productName: linked ? linked.name : '',
                            sku: linked ? linked.sku : 'RAW'
                          }));
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm cursor-pointer"
                      >
                        <option value="">Select scent/base...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name} ({p.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Manual Name (For Unlisted Raw Oils)</label>
                      <input 
                        type="text" 
                        value={newBatch.productName || ''}
                        onChange={e => setNewBatch(prev => ({ ...prev, productName: e.target.value }))}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                        placeholder="e.g. Saffron Absolute Oil"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Batch Details */}
                <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Batch Lot Code</label>
                      <input 
                        type="text" 
                        required
                        value={newBatch.batchNumber || ''}
                        onChange={e => setNewBatch(prev => ({ ...prev, batchNumber: e.target.value.toUpperCase() }))}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm"
                        placeholder="e.g. B-OIL-AVN-001"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Carrier / Medium Type</label>
                      <select
                        value={newBatch.carrierType || 'oil_base'}
                        required
                        onChange={e => {
                          const carrier = e.target.value as any;
                          const shelfLifeYears = carrier === 'oil_base' ? 2 : carrier === 'alcohol_base' ? 3 : 1;
                          const mDate = newBatch.manufactureDate || new Date().toISOString().split('T')[0];
                          const eDate = new Date(new Date(mDate).setFullYear(new Date(mDate).getFullYear() + shelfLifeYears)).toISOString().split('T')[0];
                          setNewBatch(prev => ({
                            ...prev,
                            carrierType: carrier,
                            expiryDate: eDate
                          }));
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm cursor-pointer"
                      >
                        <option value="oil_base">Perfume Oil Base (Attar)</option>
                        <option value="alcohol_base">Ethanol / Alcohol Base</option>
                        <option value="mixed_fragrance">Mixed Scent Formulation</option>
                        <option value="other">Other Medium</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Volumetric & Finance */}
                <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Initial Vol. (ml)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={newBatch.initialQuantityMl || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setNewBatch(prev => ({ ...prev, initialQuantityMl: val, remainingQuantityMl: val }));
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Remaining (ml)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={newBatch.remainingQuantityMl ?? ''}
                        onChange={e => setNewBatch(prev => ({ ...prev, remainingQuantityMl: parseInt(e.target.value) || 0 }))}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Cost Per Ml (AED)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        min="0"
                        value={newBatch.costPerMl || ''}
                        onChange={e => setNewBatch(prev => ({ ...prev, costPerMl: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Shelf life details */}
                <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-1.5">
                        <Calendar size={12} /> Manufacture Date
                      </label>
                      <input 
                        type="date" 
                        required
                        value={newBatch.manufactureDate || ''}
                        onChange={e => {
                          const mDate = e.target.value;
                          const shelfLifeYears = newBatch.carrierType === 'oil_base' ? 2 : newBatch.carrierType === 'alcohol_base' ? 3 : 1;
                          const eDate = new Date(new Date(mDate).setFullYear(new Date(mDate).getFullYear() + shelfLifeYears)).toISOString().split('T')[0];
                          setNewBatch(prev => ({ ...prev, manufactureDate: mDate, expiryDate: eDate }));
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-1.5">
                        <Clock size={12} /> Expiry Date
                      </label>
                      <input 
                        type="date" 
                        required
                        value={newBatch.expiryDate || ''}
                        onChange={e => setNewBatch(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Location & Notes */}
                <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-1.5">
                        <MapPin size={12} /> Storage Drawer / Room Slot
                      </label>
                      <input 
                        type="text" 
                        value={newBatch.locationSlot || ''}
                        onChange={e => setNewBatch(prev => ({ ...prev, locationSlot: e.target.value }))}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                        placeholder="e.g. Lab Fridge A, Drawer 3"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Additional QC Notes</label>
                      <input 
                        type="text" 
                        value={newBatch.notes || ''}
                        onChange={e => setNewBatch(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-medium text-xs"
                        placeholder="e.g. Specific gravity, scent check"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal footer actions */}
                <div className="pt-8 border-t border-gray-50 flex items-center gap-6 bg-white sticky bottom-0">
                  <button 
                    type="button" 
                    onClick={() => setShowBatchModal(false)}
                    className="flex-1 py-5 px-8 border-2 border-gray-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-400"
                  >
                    Abort enrolment
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 px-8 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-black/20"
                  >
                    <Save size={18} strokeWidth={3} />
                    {isEditingBatch ? 'COMMIT BATCH DATA' : 'AUTHORIZE BATCH ENROLMENT'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Bulk Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!importLoading) {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview([]);
                  setImportError(null);
                }
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                    <FileSpreadsheet size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight">BULK UPLOAD stock</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">STANDARD CSV INVENTORY INGESTION</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!importLoading) {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportPreview([]);
                      setImportError(null);
                    }
                  }}
                  disabled={importLoading}
                  className="w-12 h-12 hover:bg-gray-50 rounded-2xl transition-all text-gray-300 hover:text-black flex items-center justify-center disabled:opacity-55"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-8">
                {/* Mode Selector & Description */}
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-black">DUPLICATE SKU PROTOCOL</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Specify action when a product SKU in the CSV matches an existing record.</p>
                  </div>
                  <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm shrink-0">
                    <button
                      type="button"
                      onClick={() => setImportMode('skip')}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        importMode === 'skip' ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-black"
                      )}
                    >
                      SKIP DUPLICATES
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('overwrite')}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        importMode === 'overwrite' ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-[#C5A059]"
                      )}
                    >
                      OVERWRITE EXISTING
                    </button>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                {!importFile ? (
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[250px]",
                      importDragActive 
                        ? "border-[#C5A059] bg-[#C5A059]/5 scale-[0.99]" 
                        : "border-gray-200 hover:border-black bg-gray-50/30 hover:bg-gray-50/60"
                    )}
                  >
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-16 h-16 bg-gray-100/80 rounded-full flex items-center justify-center text-gray-400 mb-4">
                      <Upload size={28} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-black">DRAG & DROP CSV FILE</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-2">OR CLICK TO BROWSE LOCAL FILES</p>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadTemplate();
                      }}
                      className="mt-6 px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 text-gray-600 hover:text-black active:scale-95"
                    >
                      <Download size={12} /> DOWNLOAD CSV TEMPLATE
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Selected File Banner */}
                    <div className="flex items-center justify-between bg-black text-white p-6 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                          <FileSpreadsheet size={20} className="text-[#C5A059]" />
                        </div>
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-[#C5A059]">READY FOR INGESTION</div>
                          <div className="font-mono text-sm font-bold mt-0.5">{importFile.name}</div>
                          <div className="text-[9px] text-gray-400 font-medium mt-0.5">{(importFile.size / 1024).toFixed(1)} KB • {importPreview.length} RECORDS DETECTED</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImportFile(null);
                          setImportPreview([]);
                          setImportError(null);
                        }}
                        className="px-4 py-2 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/20"
                      >
                        RESET FILE
                      </button>
                    </div>

                    {/* Preview Area */}
                    {importPreview.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-black">INGESTION DATA PREVIEW</h3>
                        </div>

                        <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-inner max-h-[350px] overflow-y-auto no-scrollbar">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-wider text-gray-400">#</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-wider text-gray-400">SKU & BARCODE</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-wider text-gray-400">PRODUCT NAME</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-wider text-gray-400">COST / PRICE</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-wider text-gray-400">STOCK & MIN</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-wider text-gray-400">STATUS PROTOCOL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white font-mono text-[11px] font-bold">
                              {importPreview.map((item, idx) => (
                                <tr key={idx} className={cn(
                                  "hover:bg-gray-50/50 transition-all",
                                  !item.isValid ? "bg-red-50/30 hover:bg-red-50/50" : ""
                                )}>
                                  <td className="px-6 py-4 text-gray-400">{idx + 1}</td>
                                  <td className="px-6 py-4">
                                    <div className="text-black uppercase">{item.sku || 'N/A'}</div>
                                    <div className="text-[9px] text-gray-400 mt-0.5">{item.barcode || 'AUTO-GENERATING'}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-black truncate max-w-[200px] font-sans font-semibold">{item.name || 'MISSING NAME'}</div>
                                    <div className="text-[9px] text-gray-400 font-medium font-sans mt-0.5">{item.category} • {item.brand || 'Scents & Souls'}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-gray-500">COST: {formatCurrency(item.costPrice)}</div>
                                    <div className="text-black mt-0.5">SELL: {formatCurrency(item.sellingPrice)}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-black">{item.stockQuantity} UNITS</div>
                                    <div className="text-[9px] text-gray-400 mt-0.5">MIN: {item.minStockLevel}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {!item.isValid ? (
                                      <div className="inline-flex flex-col gap-1">
                                        {item.validationErrors.map((err: string, eIdx: number) => (
                                          <span key={eIdx} className="bg-red-50 border border-red-100 text-red-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{err}</span>
                                        ))}
                                      </div>
                                    ) : item.skuExists ? (
                                      importMode === 'overwrite' ? (
                                        <span className="bg-amber-50 border border-amber-100 text-amber-600 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                                          <RefreshCw size={8} className="animate-spin" /> OVERWRITE
                                        </span>
                                      ) : (
                                        <span className="bg-neutral-50 border border-neutral-100 text-neutral-400 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                                          SKIPPED
                                        </span>
                                      )
                                    ) : (
                                      <span className="bg-green-50 border border-green-100 text-green-600 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                                        <Check size={8} /> NEW NODE
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* General Parsing Error */}
                {importError && (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-start gap-4">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-xs font-black text-red-800 uppercase tracking-wider">INGESTION FAULT</h4>
                      <p className="text-[10px] text-red-600 mt-1 font-medium">{importError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-10 border-t border-gray-50 flex items-center gap-6 bg-white sticky bottom-0 z-10">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                    setImportError(null);
                  }}
                  disabled={importLoading}
                  className="flex-1 py-5 px-8 border-2 border-gray-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-400 disabled:opacity-50"
                >
                  ABORT UPLOAD
                </button>
                <button 
                  type="button"
                  onClick={handleProcessImport}
                  disabled={importLoading || importPreview.length === 0 || !importPreview.some(p => p.isValid && (!p.skuExists || importMode === 'overwrite'))}
                  className="flex-[2] py-5 px-8 bg-black hover:bg-neutral-800 text-white disabled:bg-gray-100 disabled:text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-black/20"
                >
                  {importLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      PROCESSING BULK DATA...
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={3} />
                      AUTHORIZE BULK INGESTION ({importPreview.filter(p => p.isValid && (!p.skuExists || importMode === 'overwrite')).length})
                    </>
                  )}
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
