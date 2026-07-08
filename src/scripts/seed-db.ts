/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read config file from root
const configPath = join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const ProductType = {
  NEW: 'New',
  USED: 'Used',
  REPAIR: 'Repair',
  ACCESSORY: 'Accessory'
};

const generateBarcode = () => {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

const premiumScentLibrary = [
  // CREED
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
  // MAISON FRANCIS KURKDJIAN
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
  // AMOUAGE
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
    stockQuantity: 4, // Critical stock to trigger concentrations alerts!
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
  // TOM FORD
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
    stockQuantity: 2, // Low stock
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
  // SWISS ARABIAN
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
  // LATTAFA
  {
    name: 'Khamrah',
    sku: 'LTF-KHM-100',
    barcode: generateBarcode(),
    type: ProductType.NEW,
    category: 'Oud & Oriental',
    brand: 'Lattafa',
    costPrice: 80,
    sellingPrice: 180,
    stockQuantity: 150,
    minStockLevel: 15,
    imeiRequired: false,
    vatRate: 0.05,
    isActive: true,
    scentFamily: 'Sweet Amber',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Cognac, Cinnamon, Tonka Bean',
    middleNotes: 'Oak, Praline, Dates',
    baseNotes: 'Vanilla, Sandalwood'
  },
  // ROJA PARFUMS
  {
    name: 'Elysium Pour Homme',
    sku: 'ROJ-ELY-100',
    barcode: generateBarcode(),
    type: ProductType.NEW,
    category: 'Citrus & Fresh',
    brand: 'Roja Parfums',
    costPrice: 780,
    sellingPrice: 1200,
    stockQuantity: 12,
    minStockLevel: 2,
    imeiRequired: false,
    vatRate: 0.05,
    isActive: true,
    scentFamily: 'Fougère & Fresh',
    concentration: 'Parfum Cologne (15-20%)',
    topNotes: 'Grapefruit, Lemon, Bergamot, Lime, Thyme',
    middleNotes: 'Vetiver, Juniper Berries, Blackcurrant, Apple, Jasmine',
    baseNotes: 'Ambergris, Leather, Vanilla, Benzoin, Labdanum'
  },
  // XERJOFF
  {
    name: 'Naxos',
    sku: 'XER-NX-100',
    barcode: generateBarcode(),
    type: ProductType.NEW,
    category: 'Woody & Spicy',
    brand: 'Xerjoff',
    costPrice: 690,
    sellingPrice: 1050,
    stockQuantity: 10,
    minStockLevel: 2,
    imeiRequired: false,
    vatRate: 0.05,
    isActive: true,
    scentFamily: 'Aromatic Spicy Tobacco',
    concentration: 'Eau de Parfum (EDP) (15-20%)',
    topNotes: 'Lavender, Bergamot, Lemon',
    middleNotes: 'Honey, Cinnamon, Cashmeran, Jasmine Sambac',
    baseNotes: 'Tobacco Leaf, Vanilla, Tonka Bean'
  },
  {
    name: 'Alexandria II',
    sku: 'XER-AX2-100',
    barcode: generateBarcode(),
    type: ProductType.NEW,
    category: 'Oud & Oriental',
    brand: 'Xerjoff',
    costPrice: 1100,
    sellingPrice: 1750,
    stockQuantity: 5,
    minStockLevel: 2,
    imeiRequired: false,
    vatRate: 0.05,
    isActive: true,
    scentFamily: 'Amber Woody Oud',
    concentration: 'Parfum (20-30%)',
    topNotes: 'Rosewood, Lavender, Cinnamon, Apple',
    middleNotes: 'Rose, Cedarwood, Lily-of-the-Valley',
    baseNotes: 'Laotian Oud, Sandalwood, Vanilla, Amber, Musk'
  },
  // HOUSE SPECIFIC
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
  },
  {
    name: 'Midnight Rose',
    sku: 'SAS-MDR-100',
    barcode: generateBarcode(),
    type: ProductType.NEW,
    category: 'French Florals',
    brand: 'Scents & Souls',
    costPrice: 400,
    sellingPrice: 850,
    stockQuantity: 40,
    minStockLevel: 5,
    imeiRequired: false,
    vatRate: 0.05,
    isActive: true,
    scentFamily: 'Floral Oriental',
    concentration: 'Extrait de Parfum (25-40%)',
    topNotes: 'Saffron, Bergamot, Pink Pepper',
    middleNotes: 'Midnight Rose, Jasmine Sambac, Violet',
    baseNotes: 'Amber, Patchouli, Sweet Vanilla, Musk'
  }
];

async function seed() {
  console.log('--- STARTING LUXURY PERFUME SEEDING SEQUENCE ---');
  try {
    const productsColRef = collection(db, 'products');
    const snapshot = await getDocs(productsColRef);
    
    if (snapshot.size > 0) {
      console.log(`Inventory already has ${snapshot.size} records. Skipping full seeding to protect current entries.`);
      
      // Let's check if any of our premium library SKUs are missing, and insert them!
      const existingSKUs = new Set(snapshot.docs.map(doc => doc.data().sku));
      let missingCount = 0;
      
      for (const item of premiumScentLibrary) {
        if (!existingSKUs.has(item.sku)) {
          console.log(`Adding missing luxury node: ${item.name} (${item.sku})`);
          await addDoc(productsColRef, {
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          missingCount++;
        }
      }
      
      console.log(`Seeding complete. Restored ${missingCount} missing premium perfume nodes.`);
    } else {
      console.log(`Database is empty. Infusing full library of ${premiumScentLibrary.length} premium perfume nodes...`);
      for (const item of premiumScentLibrary) {
        console.log(`Infusing: ${item.name} (${item.sku})`);
        await addDoc(productsColRef, {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Database successfully populated with luxury perfume portfolio!');
    }
    
    console.log('--- SEEDING SEQUENCE SUCCESSFULLY COMPLETED ---');
    process.exit(0);
  } catch (err) {
    console.error('FATAL SEEDING ERROR:', err);
    process.exit(1);
  }
}

seed();
