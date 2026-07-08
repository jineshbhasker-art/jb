/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sale, BusinessProfile } from '../types';
import { businessProfileService } from '../lib/dbService';
import { PrintTemplates } from './PrintTemplates';

interface InvoiceProps {
  sale: Sale;
}

export const PrintInvoice = React.forwardRef<HTMLDivElement, InvoiceProps>(({ sale }, ref) => {
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const data = await businessProfileService.get();
      if (data) {
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const defaultProfile: BusinessProfile = {
    id: 'default',
    updatedAt: '',
    companyName: 'SCENTS & SOULS PERFUME LAB',
    trn: '100234567800003',
    phone: '+971 X XXX XXXX',
    email: 'lab@scentsandsouls.ae',
    address: 'Premium Business District, UAE',
    website: 'www.scentsandsouls.ae',
    termsAndConditions: '1. Goods sold are not exchangeable or refundable. 2. Repair services carry a 30-day limited warranty.',
    footerNote: 'Scan to verify this invoice on the UAE FTA Portal (Tax compliance verified).',
    logoBase64: '',
    promoPrefix: 'https://scentsandsouls.ae/promo/',
    selectedA4Template: 'corporate',
    selectedThermalTemplate: 'standard',
    primaryColor: '#000000',
    accentColor: '#C5A059',
    showLogo: true,
    showSignatureLine: true,
    showVatSummary: true,
    thermalWidth: 80,
    fontFamily: 'sans',
    autoSaveBackup: false,
    autoSaveIntervalMinutes: 30
  };

  return (
    <div ref={ref}>
      <PrintTemplates
        businessProfile={profile || defaultProfile}
        invoiceType="sales"
        data={sale}
      />
    </div>
  );
});

PrintInvoice.displayName = 'PrintInvoice';
