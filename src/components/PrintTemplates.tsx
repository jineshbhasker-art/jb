/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  User, 
  Calendar, 
  Hash, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Globe 
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { ProductType, Sale, PurchaseInvoice, Voucher, BusinessProfile } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface PrintTemplatesProps {
  type: 'sales_invoice' | 'purchase_invoice' | 'payment_voucher' | 'receipt_voucher';
  data: any; // Can be Sale, PurchaseInvoice, or Voucher
  profile: BusinessProfile | null;
  isThermal?: boolean;
}

export const PrintTemplates = React.forwardRef<HTMLDivElement, PrintTemplatesProps>(({ type, data, profile, isThermal = false }, ref) => {
  // Safe defaults
  const compName = profile?.companyName || 'SCENTS & SOULS PERFUME LAB';
  const trn = profile?.trn || '100342981500003';
  const phone = profile?.phone || '+971 4 321 0987';
  const email = profile?.email || 'lab@scentsandsouls.ae';
  const address = profile?.address || 'Luxury Boulevard, Box 1124, Dubai, UAE';
  const website = profile?.website || 'www.scentsandsouls.ae';
  const terms = profile?.termsAndConditions || '1. Items sold are non-refundable after 3 days.\n2. Repair services carry a 30-day warranty.\n3. Tax compliance verified under UAE FTA regulations.';
  const footerNote = profile?.footerNote || 'Subject to UAE Federal Tax Authority Regulations';
  const logo = profile?.logoBase64 || '';
  
  const selectedA4 = profile?.selectedA4Template || 'corporate';
  const selectedThermal = profile?.selectedThermalTemplate || 'standard';
  const primaryColor = profile?.primaryColor || '#000000';
  const accentColor = profile?.accentColor || '#C5A059';
  const fontFamily = profile?.fontFamily || 'sans';
  const showLogo = profile?.showLogo !== false;
  const showSignature = profile?.showSignatureLine !== false;
  const showVatSummary = profile?.showVatSummary !== false;
  const thermalWidth = profile?.thermalWidth || 80;

  // Font family class helper
  const getFontClass = () => {
    if (fontFamily === 'serif') return 'font-serif';
    if (fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  // ---------------------------------------------------------------------------
  // THERMAL INVOICE TEMPLATES (80mm & 58mm)
  // ---------------------------------------------------------------------------
  const renderThermalTemplate = () => {
    // Determine sale structure
    let saleData: Sale = data as Sale;
    if (type !== 'sales_invoice') {
      // Create fallback sale representation if printing other types on thermal
      saleData = {
        id: data.id || 'V-000',
        invoiceNumber: data.invoiceNumber || data.voucherNumber || 'V-000',
        subtotal: data.subtotal || data.totalAmount || 0,
        vatTotal: data.vatTotal || 0,
        discount: 0,
        grandTotal: data.grandTotal || data.totalAmount || 0,
        paymentMethod: data.paymentMethod || 'cash',
        status: data.status || 'COMPLETED',
        receivedAmount: data.receivedAmount || data.grandTotal || data.totalAmount || 0,
        changeAmount: data.changeAmount || 0,
        cashierId: data.cashierId || data.createdBy || 'staff',
        cashierName: data.cashierName || data.createdBy || 'Staff',
        items: data.items || [],
        createdAt: data.createdAt || data.date || new Date().toISOString()
      } as Sale;
    }

    const items = saleData.items || [];

    if (selectedThermal === 'compact' || thermalWidth === 58) {
      // 58mm Ultra Compact Layout
      return (
        <div className="w-[54mm] p-1 bg-white text-black text-[9px] font-mono leading-tight space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-black uppercase">{compName}</h2>
            <p className="text-[8px] uppercase">{address}</p>
            <p className="text-[8px]">TRN: {trn}</p>
            {phone && <p className="text-[8px]">TEL: {phone}</p>}
          </div>

          <div className="border-t border-dashed border-black pt-1 space-y-0.5 text-[8px]">
            <p>INV: {saleData.invoiceNumber}</p>
            <p>DATE: {new Date(saleData.createdAt).toLocaleDateString()}</p>
            <p>CASHIER: {saleData.cashierName.toUpperCase()}</p>
          </div>

          <div className="border-t border-dashed border-black pt-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black text-[8px]">
                  <th className="pb-1">ITEM</th>
                  <th className="pb-1 text-center">QTY</th>
                  <th className="pb-1 text-right">TOT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dotted divide-gray-300">
                {items.map((item: any, i: number) => (
                  <tr key={i} className="align-top">
                    <td className="py-1 max-w-[28mm] truncate font-bold">{item.name}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">{formatCurrency(item.totalWithVat).replace(' AED', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-dashed border-black pt-1 space-y-1 text-right text-[8px]">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>{formatCurrency(saleData.subtotal).replace(' AED', '')}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (5%):</span>
              <span>{formatCurrency(saleData.vatTotal).replace(' AED', '')}</span>
            </div>
            {saleData.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>DISC:</span>
                <span>-{formatCurrency(saleData.discount).replace(' AED', '')}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-[10px] border-t border-black pt-1">
              <span>TOTAL AED:</span>
              <span>{formatCurrency(saleData.grandTotal).replace(' AED', '')}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black pt-2 text-center text-[8px] space-y-1">
            <p className="font-bold">THANK YOU</p>
            <p className="text-[7px] uppercase">{footerNote}</p>
          </div>
        </div>
      );
    }

    if (selectedThermal === 'premium') {
      // 80mm Premium Detailed Thermal
      return (
        <div className="w-[74mm] p-3 bg-white text-black text-[10px] font-mono leading-relaxed space-y-4">
          <div className="flex flex-col items-center text-center space-y-1.5">
            {showLogo && logo ? (
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain mb-1" />
            ) : (
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white mb-1">
                <Building2 size={20} />
              </div>
            )}
            <h2 className="text-sm font-black uppercase tracking-tight">{compName}</h2>
            <p className="text-[8px] text-gray-500 uppercase leading-normal px-2">{address}</p>
            <div className="text-[9px] bg-gray-100 px-2 py-0.5 rounded border border-gray-200 mt-1">
              TRN: <span className="font-bold">{trn}</span>
            </div>
            <p className="text-[8px] text-gray-500">PH: {phone} | E: {email}</p>
          </div>

          <div className="border-y-2 border-black py-2 space-y-1 text-[9px]">
            <div className="flex justify-between">
              <span className="text-gray-500">TAX INVOICE:</span>
              <span className="font-bold">{saleData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DATE & TIME:</span>
              <span className="font-bold">{new Date(saleData.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CLIENT ENTITY:</span>
              <span className="font-bold uppercase">{saleData.customerName || 'CASH CLIENT'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">OPERATOR:</span>
              <span className="font-bold uppercase">{saleData.cashierName}</span>
            </div>
          </div>

          <div>
            <table className="w-full text-left text-[9px]">
              <thead>
                <tr className="border-b border-black font-black uppercase text-[8px] text-gray-500">
                  <th className="pb-1.5">ITEM DESCRIPTION</th>
                  <th className="pb-1.5 text-center">QTY</th>
                  <th className="pb-1.5 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item: any, i: number) => (
                  <tr key={i} className="align-top">
                    <td className="py-2 pr-1">
                      <span className="font-bold uppercase">{item.name}</span>
                      {item.imei && item.imei.length > 0 && (
                        <p className="text-[7px] text-gray-400">SN: {item.imei.join(', ')}</p>
                      )}
                    </td>
                    <td className="py-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-2 text-right font-bold">{formatCurrency(item.totalWithVat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-black pt-3 space-y-1.5 text-right text-[9px]">
            <div className="flex justify-between">
              <span className="text-gray-400">SUBTOTAL (EX. TAX):</span>
              <span>{formatCurrency(saleData.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VAT (5%):</span>
              <span>{formatCurrency(saleData.vatTotal)}</span>
            </div>
            {saleData.discount > 0 && (
              <div className="flex justify-between text-red-500 font-bold">
                <span>DISCOUNT:</span>
                <span>-{formatCurrency(saleData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xs pt-2 border-t border-dashed border-gray-300">
              <span className="tracking-tight">GRAND TOTAL:</span>
              <span className="text-black text-sm">{formatCurrency(saleData.grandTotal)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 pt-3 space-y-2 text-center">
            <div className="flex justify-between text-[8px] bg-gray-50 p-2 rounded">
              <span>TENDERED: {formatCurrency(saleData.receivedAmount)}</span>
              <span>CHANGE: {formatCurrency(saleData.changeAmount)}</span>
            </div>
            <p className="font-black text-[9px] uppercase tracking-wide">THANK YOU FOR YOUR PATRONAGE</p>
            <p className="text-[7px] text-gray-400 uppercase leading-relaxed max-w-[180px] mx-auto">{footerNote}</p>
            
            <div className="flex flex-col items-center pt-2">
              <div className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                <QRCodeSVG value={`${saleData.invoiceNumber}|${saleData.grandTotal}|${trn}`} size={64} />
              </div>
              <span className="text-[6px] text-gray-400 mt-1 uppercase">Scan to Verify compliance</span>
            </div>
          </div>
        </div>
      );
    }

    // Default Standard 80mm POS Template
    return (
      <div className="w-[74mm] p-2 bg-white text-black text-[10px] font-mono space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-sm font-black uppercase leading-tight">{compName}</h2>
          <p className="text-[8px] uppercase">{address}</p>
          <p className="text-[8px]">TRN: {trn}</p>
          <p className="text-[8px]">TEL: {phone}</p>
        </div>

        <div className="border-y border-dashed border-black py-2 text-[8px] space-y-1">
          <p>TAX INVOICE: {saleData.invoiceNumber}</p>
          <p>DATE: {new Date(saleData.createdAt).toLocaleString()}</p>
          <p>CLIENT: {saleData.customerName || 'CASH CUSTOMER'}</p>
          <p>CASHIER: {saleData.cashierName.toUpperCase()}</p>
        </div>

        <table className="w-full text-left text-[8px] border-b border-dashed border-black">
          <thead>
            <tr className="border-b border-black">
              <th className="pb-1">DESCRIPTION</th>
              <th className="pb-1 text-center">QTY</th>
              <th className="pb-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i: number) => (
              <tr key={i} className="align-top">
                <td className="py-1">
                  <p className="font-bold">{item.name}</p>
                  {item.imei && item.imei.length > 0 && <p className="text-[7px] text-gray-400">SN: {item.imei[0]}</p>}
                </td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right font-bold">{formatCurrency(item.totalWithVat).replace(' AED', '')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-right text-[8px] font-bold">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{formatCurrency(saleData.subtotal).replace(' AED', '')}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (5%):</span>
            <span>{formatCurrency(saleData.vatTotal).replace(' AED', '')}</span>
          </div>
          {saleData.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>DISCOUNT:</span>
              <span>-{formatCurrency(saleData.discount).replace(' AED', '')}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-[10px] border-t border-black pt-1 mt-1">
            <span>GRAND TOTAL AED:</span>
            <span>{formatCurrency(saleData.grandTotal).replace(' AED', '')}</span>
          </div>
        </div>

        <div className="text-center text-[7px] text-gray-500 pt-2 space-y-1 border-t border-dashed border-black">
          <p className="font-bold text-black text-[8px]">THANK YOU FOR YOUR BUSINESS</p>
          <p className="uppercase">{footerNote}</p>
        </div>
      </div>
    );
  };

  if (isThermal) {
    return (
      <div ref={ref} className="print-thermal-wrapper flex justify-center bg-gray-50 p-6 border rounded-3xl shadow-inner overflow-x-auto">
        {renderThermalTemplate()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // A4 INVOICE & VOUCHER TEMPLATES (10 BEST DESIGNED TAX INVOICE STRUCTURES)
  // ---------------------------------------------------------------------------

  // Unified adapter to turn sales, purchase, or voucher details into uniform print fields
  const getPrintDetails = () => {
    let title = 'TAX INVOICE / فاتورة ضريبية';
    let numberLabel = 'INVOICE NO';
    let dateLabel = 'DATE OF ISSUE';
    let number = '';
    let date = '';
    let partyLabel = 'CLIENT DETAILS';
    let partyName = '';
    let partyContact = '';
    let partyAddress = '';
    let partyTrn = '';
    let items: any[] = [];
    let subtotal = 0;
    let vatTotal = 0;
    let discount = 0;
    let grandTotal = 0;
    let paymentMethodStr = '';
    let termsAndNotes = terms;

    if (type === 'sales_invoice') {
      const sale: Sale = data;
      title = 'TAX INVOICE / فاتورة ضريبية';
      numberLabel = 'INVOICE NUMBER';
      number = sale.invoiceNumber;
      date = new Date(sale.createdAt).toLocaleDateString('en-GB');
      partyLabel = 'BILL TO (RECIPIENT)';
      partyName = sale.customerName || 'CASH CUSTOMER';
      partyContact = '';
      partyAddress = 'Dubai, United Arab Emirates';
      items = (sale.items || []).map((item, idx) => ({
        sNo: idx + 1,
        desc: item.name,
        details: item.imei && item.imei.length > 0 ? `S/N: ${item.imei.join(', ')}` : '',
        qty: item.quantity,
        rate: item.unitPrice,
        vat: item.vatAmount,
        total: item.totalWithVat
      }));
      subtotal = sale.subtotal;
      vatTotal = sale.vatTotal;
      discount = sale.discount || 0;
      grandTotal = sale.grandTotal;
      paymentMethodStr = sale.paymentMethod;
      termsAndNotes = sale.notes ? `${sale.notes}\n\n${terms}` : terms;
    } else if (type === 'purchase_invoice') {
      const purchase: PurchaseInvoice = data;
      title = 'PURCHASE INVOICE / فاتورة الشراء';
      numberLabel = 'PURCHASE NO';
      number = purchase.invoiceNumber;
      date = new Date(purchase.date || purchase.createdAt).toLocaleDateString('en-GB');
      partyLabel = 'SUPPLIER VENDOR';
      partyName = purchase.supplierName;
      partyTrn = ''; // Fetch from vendor if needed
      items = (purchase.items || []).map((item, idx) => ({
        sNo: idx + 1,
        desc: item.name,
        qty: item.quantity,
        rate: item.unitCost,
        vat: item.vatAmount,
        total: item.total
      }));
      subtotal = purchase.subtotal;
      vatTotal = purchase.vatTotal;
      grandTotal = purchase.grandTotal;
      paymentMethodStr = purchase.paymentMethod;
    } else if (type === 'payment_voucher') {
      const voucher: Voucher = data;
      title = 'PAYMENT VOUCHER / سند صرف';
      numberLabel = 'VOUCHER NO';
      number = voucher.voucherNumber;
      date = new Date(voucher.date || voucher.createdAt).toLocaleDateString('en-GB');
      partyLabel = 'PAID TO (BENEFICIARY)';
      partyName = voucher.items?.[0]?.description || voucher.reference || 'Vendor Account';
      items = (voucher.items || []).map((item, idx) => ({
        sNo: idx + 1,
        desc: `${item.account} - ${item.description}`,
        qty: 1,
        rate: item.debit || item.credit || voucher.totalAmount,
        vat: 0,
        total: item.debit || item.credit || voucher.totalAmount
      }));
      subtotal = voucher.totalAmount;
      vatTotal = 0;
      grandTotal = voucher.totalAmount;
      termsAndNotes = voucher.notes ? `Voucher Notes:\n${voucher.notes}` : '';
    } else if (type === 'receipt_voucher') {
      const voucher: Voucher = data;
      title = 'RECEIPT VOUCHER / سند قبض';
      numberLabel = 'RECEIPT NO';
      number = voucher.voucherNumber;
      date = new Date(voucher.date || voucher.createdAt).toLocaleDateString('en-GB');
      partyLabel = 'RECEIVED FROM';
      partyName = voucher.items?.[0]?.description || voucher.reference || 'Customer / Depositor';
      items = (voucher.items || []).map((item, idx) => ({
        sNo: idx + 1,
        desc: `${item.account} - ${item.description}`,
        qty: 1,
        rate: item.debit || item.credit || voucher.totalAmount,
        vat: 0,
        total: item.debit || item.credit || voucher.totalAmount
      }));
      subtotal = voucher.totalAmount;
      vatTotal = 0;
      grandTotal = voucher.totalAmount;
      termsAndNotes = voucher.notes ? `Voucher Notes:\n${voucher.notes}` : '';
    }

    return {
      title,
      numberLabel,
      dateLabel,
      number,
      date,
      partyLabel,
      partyName,
      partyContact,
      partyAddress,
      partyTrn,
      items,
      subtotal,
      vatTotal,
      discount,
      grandTotal,
      paymentMethodStr,
      termsAndNotes
    };
  };

  const details = getPrintDetails();

  // Color variables injection styles
  const textStyle = { color: primaryColor };
  const borderStyle = { borderColor: primaryColor };
  const bgStyle = { backgroundColor: primaryColor, color: '#FFFFFF' };
  const accentTextStyle = { color: accentColor };
  const accentBgStyle = { backgroundColor: accentColor, color: '#FFFFFF' };

  // ---------------------------------------------------------------------------
  // 10 A4 TEMPLATES SWITCH
  // ---------------------------------------------------------------------------
  const renderA4Template = () => {
    switch (selectedA4) {
      // 1. Corporate Classic
      case 'corporate':
        return (
          <div className="space-y-10">
            <div className="flex justify-between items-start border-b-4 border-black pb-8">
              <div className="flex gap-6">
                {showLogo && logo ? (
                  <img src={logo} alt="Company Logo" className="w-24 h-24 object-contain" />
                ) : (
                  <div className="w-24 h-24 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl">
                    <Building2 size={40} />
                  </div>
                )}
                <div className="space-y-1">
                  <h1 className="text-2xl font-black uppercase tracking-tight" style={textStyle}>{compName}</h1>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Corporate HQ Node</p>
                  <div className="text-[10px] text-gray-500 space-y-0.5 font-bold uppercase tracking-wide mt-2">
                    <p>{address}</p>
                    <p>TRN: {trn} | TEL: {phone}</p>
                    <p>EMAIL: {email} | WEB: {website}</p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="px-5 py-2 font-black uppercase tracking-[0.25em] inline-block text-xs" style={bgStyle}>
                  {details.title.split(' / ')[0]}
                </div>
                <p className="text-xl font-black tracking-tight">{details.number}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{details.dateLabel}: {details.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{details.partyLabel}</p>
                <p className="text-sm font-black uppercase" style={accentTextStyle}>{details.partyName}</p>
                {details.partyAddress && <p className="text-xs text-gray-500">{details.partyAddress}</p>}
                {details.partyTrn && <p className="text-xs text-gray-500 font-mono">TRN: {details.partyTrn}</p>}
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">PAYMENT DETAILS</p>
                <p className="text-sm font-bold uppercase">{details.paymentMethodStr.replace('_', ' ')}</p>
                <p className="text-xs text-gray-500">CURRENCY: AED (UAE DIRHAM)</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-black" style={{ ...borderStyle }}>
                  <th className="py-3 font-black uppercase tracking-widest text-gray-500 text-[10px] w-12">S.NO</th>
                  <th className="py-3 font-black uppercase tracking-widest text-gray-500 text-[10px]">ITEMS & DESCRIPTION</th>
                  <th className="py-3 font-black uppercase tracking-widest text-gray-500 text-[10px] text-center w-20">QTY</th>
                  <th className="py-3 font-black uppercase tracking-widest text-gray-500 text-[10px] text-right w-32">RATE (AED)</th>
                  <th className="py-3 font-black uppercase tracking-widest text-gray-500 text-[10px] text-right w-24">VAT (5%)</th>
                  <th className="py-3 font-black uppercase tracking-widest text-gray-500 text-[10px] text-right w-32">TOTAL (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {details.items.map((item, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-4 font-black text-gray-400">{item.sNo}</td>
                    <td className="py-4 space-y-1">
                      <p className="font-bold text-sm uppercase">{item.desc}</p>
                      {item.details && <p className="text-[10px] font-mono text-gray-400">{item.details}</p>}
                    </td>
                    <td className="py-4 text-center font-bold text-sm">{item.qty}</td>
                    <td className="py-4 text-right font-bold text-sm">{formatCurrency(item.rate).replace(' AED', '')}</td>
                    <td className="py-4 text-right font-bold text-sm text-gray-400">{formatCurrency(item.vat).replace(' AED', '')}</td>
                    <td className="py-4 text-right font-black text-sm">{formatCurrency(item.total).replace(' AED', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-100 pt-6 flex justify-between items-start">
              <div className="max-w-md space-y-3">
                <h5 className="text-[10px] font-black uppercase tracking-widest" style={accentTextStyle}>Terms & Conditions</h5>
                <p className="text-[9px] text-gray-400 uppercase leading-relaxed whitespace-pre-line font-medium">{details.termsAndNotes}</p>
              </div>
              <div className="w-80 space-y-3 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400 uppercase tracking-widest">SUBTOTAL (EXCL. VAT)</span>
                  <span>{formatCurrency(details.subtotal)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">VAT (5%)</span>
                    <span>{formatCurrency(details.vatTotal)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between font-bold text-red-500">
                    <span className="uppercase tracking-widest">DISCOUNT</span>
                    <span>-{formatCurrency(details.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base border-t-2 border-black pt-3" style={{ ...borderStyle }}>
                  <span className="uppercase tracking-tight">TOTAL PAYABLE</span>
                  <span style={accentTextStyle}>{formatCurrency(details.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 2. Minimalist Swiss
      case 'swiss':
        return (
          <div className="space-y-12">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                {showLogo && logo && <img src={logo} alt="Logo" className="h-16 object-contain" />}
                <div className="space-y-1">
                  <h1 className="text-3xl font-light tracking-tight text-gray-900">{compName}</h1>
                  <p className="text-xs text-gray-400">{address} • TRN {trn}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400">{details.title.split(' / ')[0]}</h2>
                <p className="text-2xl font-light text-gray-900">{details.number}</p>
                <p className="text-xs text-gray-400">Date: {details.date}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8 grid grid-cols-2 gap-12 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">{details.partyLabel}</span>
                <p className="text-sm font-bold text-gray-800 mt-2">{details.partyName}</p>
                <p className="text-gray-500 mt-1">{details.partyAddress}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Transaction details</span>
                <p className="text-sm font-medium text-gray-800 mt-2">Method: {details.paymentMethodStr.toUpperCase()}</p>
                <p className="text-gray-500 mt-1">Currency: AED</p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="py-2 font-medium w-12">No.</th>
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 font-medium text-center w-20">Qty</th>
                  <th className="py-2 font-medium text-right w-32">Rate</th>
                  <th className="py-2 font-medium text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {details.items.map((item, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="py-4 font-mono text-gray-300">{idx + 1}.</td>
                    <td className="py-4">
                      <p className="font-bold text-gray-900">{item.desc}</p>
                      {item.details && <p className="text-[10px] text-gray-400 mt-0.5">{item.details}</p>}
                    </td>
                    <td className="py-4 text-center font-mono">{item.qty}</td>
                    <td className="py-4 text-right font-mono">{formatCurrency(item.rate).replace(' AED', '')}</td>
                    <td className="py-4 text-right font-bold text-gray-900 font-mono">{formatCurrency(item.total).replace(' AED', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-start pt-8 border-t border-gray-100 text-xs">
              <div className="max-w-md text-gray-400 leading-relaxed text-[10px]">
                <p className="font-bold text-gray-600 mb-1">Notes</p>
                <p className="whitespace-pre-line">{details.termsAndNotes}</p>
              </div>
              <div className="w-72 space-y-2 text-right">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(details.subtotal)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between text-gray-500">
                    <span>VAT (5%):</span>
                    <span className="font-mono">{formatCurrency(details.vatTotal)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(details.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total Payable:</span>
                  <span className="font-mono">{formatCurrency(details.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 3. Modern Tech
      case 'tech':
        return (
          <div className="space-y-8 font-mono text-xs">
            <div className="border border-emerald-500/20 bg-emerald-950/5 p-6 rounded-3xl flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest">SYSTEM NODE</span>
                <h2 className="text-lg font-black uppercase text-emerald-800 tracking-tight">{compName}</h2>
                <p className="text-[10px] text-gray-400 uppercase">COORD: {address} • TRN: {trn}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{details.title.split(' / ')[0]}</p>
                <p className="text-lg font-black text-gray-900">{details.number}</p>
                <p className="text-[10px] text-gray-400">TIMESTAMP: {details.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-[11px]">
              <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">RECIPIENT_GATEWAY:</span>
                <p className="font-black mt-1 text-gray-800 uppercase">{details.partyName}</p>
                <p className="text-gray-400 text-[10px] mt-1">{details.partyAddress}</p>
              </div>
              <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">TRANSACTION_PROTOCOLS:</span>
                <p className="font-bold mt-1 text-gray-800 uppercase">CHANNEL: {details.paymentMethodStr}</p>
                <p className="text-gray-400 text-[10px] mt-1">CURRENCY: AED (STANDARD)</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-500 text-[10px] uppercase text-emerald-800 font-bold">
                  <th className="py-2">#</th>
                  <th className="py-2">METADATA_DESCRIPTION</th>
                  <th className="py-2 text-center w-16">QTY</th>
                  <th className="py-2 text-right w-24">RATE</th>
                  <th className="py-2 text-right w-24">VAT</th>
                  <th className="py-2 text-right w-28">GROSS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600">
                {details.items.map((item, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="py-3 font-bold text-emerald-500">{idx + 1}</td>
                    <td className="py-3">
                      <p className="font-black text-gray-800 uppercase">{item.desc}</p>
                      {item.details && <p className="text-[9px] text-gray-400 mt-0.5">{item.details}</p>}
                    </td>
                    <td className="py-3 text-center">{item.qty}</td>
                    <td className="py-3 text-right">{item.rate.toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-400">{item.vat.toFixed(2)}</td>
                    <td className="py-3 text-right font-black text-gray-800">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-start pt-6 border-t border-gray-100">
              <div className="max-w-md text-[9px] text-gray-400 uppercase leading-relaxed">
                <p className="font-black text-gray-600 mb-1">// TERMS_AND_CONDITIONS</p>
                <p className="whitespace-pre-line">{details.termsAndNotes}</p>
              </div>
              <div className="w-72 bg-emerald-50/30 border border-emerald-500/10 p-5 rounded-2xl space-y-2 text-right">
                <div className="flex justify-between text-gray-500 text-[10px]">
                  <span>SUB_NET_TOTAL:</span>
                  <span>{details.subtotal.toFixed(2)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between text-gray-500 text-[10px]">
                    <span>TAX_COLLECTED:</span>
                    <span>{details.vatTotal.toFixed(2)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between text-red-500 text-[10px] font-bold">
                    <span>DISCOUNT_APPLIED:</span>
                    <span>-{details.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-emerald-800 border-t border-emerald-500/30 pt-2">
                  <span>GRAND_PAYABLE:</span>
                  <span>{details.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 4. Classic Elegance (Serif)
      case 'serif':
        return (
          <div className="space-y-10 font-serif text-xs">
            <div className="text-center space-y-4 border-b border-gray-200 pb-10">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-serif italic">{compName}</h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Besoke Perfumery & Scent Lab</p>
              <div className="text-[10px] text-gray-400 flex justify-center gap-6 font-sans">
                <span>{address}</span>
                <span>•</span>
                <span>TRN: {trn}</span>
                <span>•</span>
                <span>Phone: {phone}</span>
              </div>
            </div>

            <div className="flex justify-between items-start pt-4 font-sans">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">{details.partyLabel}</span>
                <p className="text-sm font-black text-gray-800 uppercase">{details.partyName}</p>
                <p className="text-xs text-gray-500">{details.partyAddress}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">{details.title.split(' / ')[0]}</span>
                <p className="text-lg font-black text-gray-800">{details.number}</p>
                <p className="text-xs text-gray-500">Issued On: {details.date}</p>
              </div>
            </div>

            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-gray-300 font-serif italic text-sm text-gray-800">
                  <th className="py-3 w-12">No.</th>
                  <th className="py-3">Formulation & Flacon Specs</th>
                  <th className="py-3 text-center w-20">Quantity</th>
                  <th className="py-3 text-right w-32">Rate</th>
                  <th className="py-3 text-right w-32">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600">
                {details.items.map((item, i) => (
                  <tr key={i} className="align-middle">
                    <td className="py-4 text-gray-300">{item.sNo}</td>
                    <td className="py-4">
                      <p className="font-bold text-gray-900">{item.desc}</p>
                      {item.details && <p className="text-[10px] text-gray-400 italic font-serif">{item.details}</p>}
                    </td>
                    <td className="py-4 text-center">{item.qty}</td>
                    <td className="py-4 text-right">{formatCurrency(item.rate).replace(' AED', '')}</td>
                    <td className="py-4 text-right font-bold text-gray-900">{formatCurrency(item.total).replace(' AED', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-start pt-8 border-t border-gray-100 font-sans">
              <div className="max-w-md text-[9px] text-gray-400 leading-relaxed font-sans">
                <p className="font-bold text-gray-500 uppercase tracking-widest mb-1 text-[8px]">Terms & Provisions</p>
                <p className="whitespace-pre-line italic font-serif">{details.termsAndNotes}</p>
              </div>
              <div className="w-80 space-y-2 text-right text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Exclusive Net:</span>
                  <span>{formatCurrency(details.subtotal)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between text-gray-500">
                    <span>VAT (5%):</span>
                    <span>{formatCurrency(details.vatTotal)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span>-{formatCurrency(details.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-300 pt-2 font-serif italic">
                  <span>Total Payable:</span>
                  <span>{formatCurrency(details.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 5. Bold Brutalist
      case 'brutalist':
        return (
          <div className="space-y-10 font-sans text-xs border-[3px] border-black p-10">
            <div className="flex justify-between items-start border-b-[3px] border-black pb-8">
              <div className="space-y-4">
                <h1 className="text-3xl font-black uppercase tracking-tight text-black">{compName}</h1>
                <div className="text-[11px] font-bold uppercase space-y-0.5">
                  <p>ADD: {address}</p>
                  <p>TRN: {trn} | TEL: {phone}</p>
                </div>
              </div>
              <div className="text-right border-[3px] border-black p-4 bg-yellow-300 shadow-[4px_4px_0px_#000000]">
                <h2 className="font-black uppercase tracking-widest text-xs text-black">{details.title.split(' / ')[0]}</h2>
                <p className="text-xl font-black mt-1 text-black">{details.number}</p>
                <p className="text-[10px] font-bold mt-1 text-black">DATE: {details.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 font-bold border-b-[3px] border-black pb-8">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{details.partyLabel}</span>
                <p className="text-sm font-black text-black uppercase">{details.partyName}</p>
                <p className="text-[10px] text-gray-600 uppercase">{details.partyAddress}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">PAYMENT_METHOD</span>
                <p className="text-sm font-black uppercase text-black">{details.paymentMethodStr}</p>
                <p className="text-[10px] text-gray-600">CURRENCY: AED</p>
              </div>
            </div>

            <table className="w-full text-left border-[3px] border-black">
              <thead>
                <tr className="bg-black text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-3 w-12">#</th>
                  <th className="p-3">ITEM DESCRIPTION</th>
                  <th className="p-3 text-center w-20">QTY</th>
                  <th className="p-3 text-right w-32">RATE (AED)</th>
                  <th className="p-3 text-right w-32">TOTAL (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-black font-bold text-black">
                {details.items.map((item, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="p-3 border-r-[2px] border-black text-center">{idx + 1}</td>
                    <td className="p-3 border-r-[2px] border-black">
                      <p className="font-black uppercase text-xs">{item.desc}</p>
                      {item.details && <p className="text-[10px] text-gray-500 font-mono">{item.details}</p>}
                    </td>
                    <td className="p-3 border-r-[2px] border-black text-center">{item.qty}</td>
                    <td className="p-3 border-r-[2px] border-black text-right">{item.rate.toFixed(2)}</td>
                    <td className="p-3 text-right font-black">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-start pt-6">
              <div className="max-w-md text-[9px] text-gray-500 font-bold uppercase leading-relaxed">
                <p className="font-black text-black mb-1">// TERMS AND CONTRACTS</p>
                <p className="whitespace-pre-line">{details.termsAndNotes}</p>
              </div>
              <div className="w-80 border-[3px] border-black p-5 bg-white shadow-[6px_6px_0px_#000000] space-y-2 text-right font-bold text-black">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{details.subtotal.toFixed(2)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between">
                    <span>VAT (5%):</span>
                    <span>{details.vatTotal.toFixed(2)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>DISCOUNT:</span>
                    <span>-{details.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black border-t-[3px] border-black pt-2 bg-yellow-300 p-2 -mx-5 -mb-5 mt-2">
                  <span>TOTAL AED:</span>
                  <span>{details.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 6. UAE Emerald (Arabic-bilingual styled)
      case 'emerald':
        return (
          <div className="space-y-10 font-sans text-xs">
            <div className="flex justify-between items-start border-b border-emerald-600/30 pb-8">
              <div className="flex gap-6">
                {showLogo && logo ? (
                  <img src={logo} alt="Logo" className="w-24 h-24 object-contain" />
                ) : (
                  <div className="w-24 h-24 bg-emerald-950 text-[#C5A059] rounded-2xl flex items-center justify-center font-black text-xl border border-emerald-800">
                    <Building2 size={40} />
                  </div>
                )}
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">{compName}</h1>
                  <p className="text-[10px] font-bold text-emerald-600 tracking-wider">TAX COMPLIANT FACILITY / مؤسسة معتمدة ضريبياً</p>
                  <div className="text-[10px] text-gray-500 space-y-0.5 mt-2 font-medium leading-relaxed">
                    <p>{address}</p>
                    <p>TRN / الرقم الضريبي: {trn} | TEL / الهاتف: {phone}</p>
                    <p>E: {email} | W: {website}</p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="bg-emerald-850 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider rounded-xl shadow-md flex flex-col items-center">
                  <span>TAX INVOICE</span>
                  <span className="text-[8px] font-bold mt-0.5">فاتورة ضريبية</span>
                </div>
                <p className="text-lg font-black text-emerald-900 mt-2">{details.number}</p>
                <p className="text-[9px] text-gray-400 font-bold">{details.dateLabel}: {details.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 bg-emerald-50/20 p-6 rounded-3xl border border-emerald-100/50">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">BILL TO / الفاتورة إلى</p>
                <p className="text-sm font-black text-emerald-900 uppercase">{details.partyName}</p>
                <p className="text-[10px] text-gray-500">{details.partyAddress}</p>
                {details.partyTrn && <p className="text-[10px] font-mono font-bold text-gray-400">TRN: {details.partyTrn}</p>}
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">PAYMENT INFO / بيانات الدفع</p>
                <p className="text-sm font-bold text-emerald-900 uppercase">{details.paymentMethodStr.toUpperCase()}</p>
                <p className="text-[10px] text-gray-500">CURRENCY / العملة: AED (UAE DIRHAM)</p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-600 text-[10px] uppercase text-emerald-900 font-black">
                  <th className="py-2.5 w-12">S.N / م</th>
                  <th className="py-2.5">DESCRIPTION & SERVICE / البيان</th>
                  <th className="py-2.5 text-center w-16">QTY / الكمية</th>
                  <th className="py-2.5 text-right w-24">RATE / السعر</th>
                  <th className="py-2.5 text-right w-24">VAT (5%) / الضريبة</th>
                  <th className="py-2.5 text-right w-28">TOTAL / الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {details.items.map((item, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="py-4 font-black text-emerald-600">{idx + 1}</td>
                    <td className="py-4 space-y-1">
                      <p className="font-bold text-gray-900 uppercase">{item.desc}</p>
                      {item.details && <p className="text-[10px] text-gray-400 font-mono">{item.details}</p>}
                    </td>
                    <td className="py-4 text-center font-bold">{item.qty}</td>
                    <td className="py-4 text-right font-bold">{formatCurrency(item.rate).replace(' AED', '')}</td>
                    <td className="py-4 text-right font-bold text-gray-400">{formatCurrency(item.vat).replace(' AED', '')}</td>
                    <td className="py-4 text-right font-black text-emerald-900">{formatCurrency(item.total).replace(' AED', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-start pt-6 border-t border-emerald-100">
              <div className="max-w-md text-[9px] text-gray-400 leading-relaxed font-sans">
                <p className="font-black text-emerald-800 uppercase tracking-widest mb-1 text-[8px]">Terms of Trade / الشروط والأحكام</p>
                <p className="whitespace-pre-line leading-relaxed">{details.termsAndNotes}</p>
              </div>
              <div className="w-80 space-y-2 text-right bg-emerald-50/10 p-5 rounded-2xl border border-emerald-100/30 font-bold">
                <div className="flex justify-between text-gray-500 text-[10px]">
                  <span>SUBTOTAL (EXCL. TAX) / الإجمالي الخاضع:</span>
                  <span>{formatCurrency(details.subtotal)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between text-gray-500 text-[10px]">
                    <span>VAT AMOUNT (5%) / قيمة ضريبة القيمة المضافة:</span>
                    <span>{formatCurrency(details.vatTotal)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between text-red-500 text-[10px]">
                    <span>DISCOUNT / الخصم:</span>
                    <span>-{formatCurrency(details.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-emerald-900 border-t border-emerald-600/30 pt-2 mt-2">
                  <span>TOTAL PAYABLE / الإجمالي المستحق:</span>
                  <span>{formatCurrency(details.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 7. Double Column / Side Grid
      case 'sidebar':
        return (
          <div className="grid grid-cols-4 gap-10 font-sans text-xs min-h-[250mm]">
            <div className="col-span-1 bg-gray-50 border-r border-gray-100 p-6 -m-10 mr-0 flex flex-col justify-between space-y-12 rounded-l-[3rem]">
              <div className="space-y-8">
                {showLogo && logo ? (
                  <img src={logo} alt="Logo" className="w-20 h-20 object-contain mx-auto" />
                ) : (
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mx-auto">
                    <Building2 size={32} />
                  </div>
                )}
                <div className="space-y-4 text-center">
                  <h3 className="font-black text-sm uppercase tracking-tight text-gray-800 leading-tight">{compName}</h3>
                  <div className="text-[9px] text-gray-400 space-y-1.5 uppercase leading-normal">
                    <p>{address}</p>
                    <p>TRN: {trn}</p>
                    <p>PH: {phone}</p>
                    <p>E: {email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-center pt-8 border-t border-gray-200">
                <div className="p-2 bg-white rounded-xl shadow-sm border">
                  <QRCodeSVG value={details.number} size={80} className="mx-auto" />
                </div>
                <span className="text-[7px] text-gray-400 uppercase tracking-widest leading-loose">UAE FTA Verified</span>
              </div>
            </div>

            <div className="col-span-3 space-y-10 pt-4">
              <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                <div>
                  <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.25em]">{details.title.split(' / ')[0]}</h2>
                  <p className="text-xl font-black mt-1 text-gray-800">{details.number}</p>
                </div>
                <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <p>{details.dateLabel}: {details.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{details.partyLabel}</span>
                  <p className="text-xs font-black text-gray-800 uppercase">{details.partyName}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{details.partyAddress}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">PAYMENT SPEC</span>
                  <p className="text-xs font-bold text-gray-800 uppercase">{details.paymentMethodStr.replace('_', ' ')}</p>
                  <p className="text-[10px] text-gray-500">AED BASE CURRENCY</p>
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black text-[9px] uppercase text-gray-400 font-black">
                    <th className="py-2 w-10">S.N</th>
                    <th className="py-2">ITEM DETAILS</th>
                    <th className="py-2 text-center w-16">QTY</th>
                    <th className="py-2 text-right w-24">RATE</th>
                    <th className="py-2 text-right w-24">VAT (5%)</th>
                    <th className="py-2 text-right w-28">GROSS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {details.items.map((item, i) => (
                    <tr key={i} className="align-middle">
                      <td className="py-3.5 font-bold text-gray-400">{i + 1}</td>
                      <td className="py-3.5">
                        <p className="font-bold text-gray-800 uppercase">{item.desc}</p>
                        {item.details && <p className="text-[9px] text-gray-400 mt-0.5">{item.details}</p>}
                      </td>
                      <td className="py-3.5 text-center font-bold">{item.qty}</td>
                      <td className="py-3.5 text-right font-bold">{formatCurrency(item.rate).replace(' AED', '')}</td>
                      <td className="py-3.5 text-right font-bold text-gray-400">{formatCurrency(item.vat).replace(' AED', '')}</td>
                      <td className="py-3.5 text-right font-black text-gray-800">{formatCurrency(item.total).replace(' AED', '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-gray-100 pt-6 flex flex-col items-end space-y-4">
                <div className="w-80 space-y-2 text-right text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Exclusive Subtotal:</span>
                    <span>{formatCurrency(details.subtotal)}</span>
                  </div>
                  {showVatSummary && (
                    <div className="flex justify-between text-gray-500">
                      <span>VAT (5%):</span>
                      <span>{formatCurrency(details.vatTotal)}</span>
                    </div>
                  )}
                  {details.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount:</span>
                      <span>-{formatCurrency(details.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-gray-800 border-t-2 border-black pt-2">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(details.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // 8. Split Top Header
      case 'split':
        return (
          <div className="space-y-10 font-sans text-xs">
            <div className="flex border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="flex-[2] bg-black text-white p-8 space-y-4 rounded-l-[2.5rem]">
                {showLogo && logo && <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />}
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">{compName}</h1>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Registry node • UAE</p>
                </div>
                <div className="text-[9px] text-white/40 space-y-0.5 uppercase leading-normal">
                  <p>{address}</p>
                  <p>TRN: {trn} | TEL: {phone}</p>
                </div>
              </div>
              <div className="flex-1 bg-yellow-400 text-black p-8 flex flex-col justify-between text-right rounded-r-[2.5rem]">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-black/60">{details.title.split(' / ')[0]}</h3>
                  <p className="text-xl font-black mt-1 leading-none">{details.number}</p>
                </div>
                <div className="text-[9px] font-bold uppercase space-y-0.5 text-black/80">
                  <p>{details.dateLabel}: {details.date}</p>
                  <p>CURRENCY: AED</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 border-b border-gray-100 pb-8">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{details.partyLabel}</span>
                <p className="text-xs font-black text-gray-850 uppercase">{details.partyName}</p>
                <p className="text-[10px] text-gray-400 uppercase leading-normal">{details.partyAddress}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">PAYMENT ROUTE</span>
                <p className="text-xs font-black uppercase text-gray-850">{details.paymentMethodStr.toUpperCase()}</p>
                <p className="text-[10px] text-gray-400">AUTHORIZED TENDER</p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black text-[9px] uppercase font-black text-gray-450 tracking-wider">
                  <th className="py-2 w-10">S.N</th>
                  <th className="py-2">DESCRIPTION & SPECIFICATIONS</th>
                  <th className="py-2 text-center w-16">QTY</th>
                  <th className="py-2 text-right w-24">RATE</th>
                  <th className="py-2 text-right w-24">VAT</th>
                  <th className="py-2 text-right w-28">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {details.items.map((item, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="py-3.5 font-bold text-gray-300">{idx + 1}</td>
                    <td className="py-3.5">
                      <p className="font-black uppercase text-gray-800">{item.desc}</p>
                      {item.details && <p className="text-[9px] text-gray-450 font-mono">{item.details}</p>}
                    </td>
                    <td className="py-3.5 text-center font-bold">{item.qty}</td>
                    <td className="py-3.5 text-right font-bold">{formatCurrency(item.rate).replace(' AED', '')}</td>
                    <td className="py-3.5 text-right font-bold text-gray-400">{formatCurrency(item.vat).replace(' AED', '')}</td>
                    <td className="py-3.5 text-right font-black text-gray-800">{formatCurrency(item.total).replace(' AED', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-start pt-6 border-t border-gray-100">
              <div className="max-w-md text-[9px] text-gray-400 uppercase leading-relaxed font-sans">
                <p className="font-black text-gray-600 mb-1">Trade & Calibration Terms</p>
                <p className="whitespace-pre-line leading-relaxed">{details.termsAndNotes}</p>
              </div>
              <div className="w-80 space-y-2 text-right text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Exclusive Net:</span>
                  <span>{formatCurrency(details.subtotal)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax (5%):</span>
                    <span>{formatCurrency(details.vatTotal)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span>-{formatCurrency(details.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-900 border-t-2 border-black pt-2">
                  <span>Grand Total (AED):</span>
                  <span>{formatCurrency(details.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 9. Compact Grid
      case 'compact':
        return (
          <div className="space-y-6 font-sans text-[11px] leading-tight">
            <div className="flex justify-between items-start border-b border-gray-250 pb-4">
              <div className="space-y-1">
                <h1 className="text-lg font-black uppercase text-gray-900">{compName}</h1>
                <p className="text-[9px] uppercase text-gray-400">TRN: {trn} • TEL: {phone} • ADD: {address}</p>
              </div>
              <div className="text-right">
                <h2 className="text-[9px] font-black text-gray-400 uppercase">{details.title.split(' / ')[0]}</h2>
                <p className="text-sm font-black text-gray-800">{details.number}</p>
                <p className="text-[9px] text-gray-400">{details.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[10px] bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase">BILL_TO:</p>
                <p className="font-black uppercase text-gray-800 mt-0.5">{details.partyName}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase">PAYMENT_INFO:</p>
                <p className="font-bold uppercase text-gray-800 mt-0.5">{details.paymentMethodStr.toUpperCase()}</p>
              </div>
            </div>

            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-black text-[9px] font-black text-gray-400 uppercase">
                  <th className="py-1">S.N</th>
                  <th className="py-1">DESCRIPTION</th>
                  <th className="py-1 text-center w-12">QTY</th>
                  <th className="py-1 text-right w-24">RATE</th>
                  <th className="py-1 text-right w-24">VAT</th>
                  <th className="py-1 text-right w-24">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {details.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-gray-300 font-bold">{idx + 1}</td>
                    <td className="py-2">
                      <p className="font-bold text-gray-800 uppercase">{item.desc}</p>
                      {item.details && <p className="text-[8px] text-gray-400 font-mono">{item.details}</p>}
                    </td>
                    <td className="py-2 text-center">{item.qty}</td>
                    <td className="py-2 text-right">{item.rate.toFixed(2)}</td>
                    <td className="py-2 text-right text-gray-300">{item.vat.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold text-gray-800">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-150 pt-4 flex justify-between items-start">
              <div className="max-w-xs text-[8px] text-gray-400 uppercase whitespace-pre-line leading-normal">
                {details.termsAndNotes}
              </div>
              <div className="w-64 space-y-1.5 text-right text-[10px] font-bold">
                <div className="flex justify-between text-gray-500">
                  <span>SUBTOTAL:</span>
                  <span>{details.subtotal.toFixed(2)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between text-gray-500">
                    <span>VAT (5%):</span>
                    <span>{details.vatTotal.toFixed(2)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>DISCOUNT:</span>
                    <span>-{details.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black border-t-2 border-black pt-1.5 mt-1">
                  <span>TOTAL AED:</span>
                  <span>{details.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 10. Elite Gold & Dark (Premium layout)
      case 'elite':
      default:
        return (
          <div className="space-y-10 font-sans text-xs">
            <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-gray-950 text-white p-8 rounded-[3.5rem] flex justify-between items-center relative overflow-hidden shadow-xl border border-gray-800">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/5 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="flex gap-6 relative z-10">
                {showLogo && logo ? (
                  <img src={logo} alt="Company Logo" className="w-20 h-20 object-contain my-auto bg-white/5 rounded-2xl p-1 border border-white/10" />
                ) : (
                  <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-[#C5A059] border border-white/10">
                    <Building2 size={36} />
                  </div>
                )}
                <div className="space-y-1">
                  <h1 className="text-xl font-black font-display tracking-tight text-white uppercase">{compName}</h1>
                  <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.25em]">Bespoke Scent Formulation & Sourcing</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-wider mt-2">{address} • TEL: {phone}</p>
                </div>
              </div>
              <div className="text-right space-y-1 relative z-10 border-l border-white/10 pl-8">
                <span className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em]">{details.title.split(' / ')[0]}</span>
                <p className="text-lg font-black text-white font-display tracking-tight mt-1">{details.number}</p>
                <p className="text-[9px] text-white/40 font-bold mt-1 uppercase">{details.dateLabel}: {details.date}</p>
                <p className="text-[8px] bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded border border-[#C5A059]/20 inline-block font-mono tracking-tighter">TRN: {trn}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 pt-4 border-b border-gray-100 pb-8">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">BILL TO RECIPIENT</span>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{details.partyName}</p>
                <p className="text-[10px] text-gray-500 uppercase">{details.partyAddress}</p>
                {details.partyTrn && <p className="text-[9px] font-mono font-bold text-gray-400 mt-1">TRN: {details.partyTrn}</p>}
              </div>
              <div className="text-right space-y-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TRANSACTION CREDENTIALS</span>
                <p className="text-sm font-bold text-gray-900 uppercase">{details.paymentMethodStr.replace('_', ' ')}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AED CURRENCY PROTOCOL</p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[9px] uppercase tracking-widest text-gray-400 font-black">
                  <th className="py-3 w-12">S.N</th>
                  <th className="py-3">FORMULATION COMPOSITION & DESCRIPTION</th>
                  <th className="py-3 text-center w-20">QTY</th>
                  <th className="py-3 text-right w-28">UNIT PRICE</th>
                  <th className="py-3 text-right w-24">TAX (5%)</th>
                  <th className="py-3 text-right w-32 text-gray-900">NET TOTAL (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {details.items.map((item, i) => (
                  <tr key={i} className="align-middle">
                    <td className="py-4 font-bold text-[#C5A059]">{i + 1}</td>
                    <td className="py-4 space-y-1">
                      <p className="font-black text-gray-800 uppercase tracking-tight text-sm">{item.desc}</p>
                      {item.details && <p className="text-[9px] text-gray-400 font-mono">{item.details}</p>}
                    </td>
                    <td className="py-4 text-center font-bold text-gray-800">{item.qty}</td>
                    <td className="py-4 text-right font-bold text-gray-700">{formatCurrency(item.rate).replace(' AED', '')}</td>
                    <td className="py-4 text-right font-bold text-gray-400">{formatCurrency(item.vat).replace(' AED', '')}</td>
                    <td className="py-4 text-right font-black text-gray-950">{formatCurrency(item.total).replace(' AED', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-100 pt-8 flex justify-between items-start">
              <div className="max-w-md space-y-4">
                <div className="space-y-1">
                  <h5 className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest">TERMS OF PATRONAGE</h5>
                  <p className="text-[9px] text-gray-400 leading-relaxed font-bold uppercase">{details.termsAndNotes}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 max-w-sm">
                  <CheckCircle2 size={16} className="text-[#C5A059]" />
                  <p className="text-[8px] text-gray-400 uppercase tracking-wider font-bold">Compliant under Decree Law No. 8 of 2017</p>
                </div>
              </div>
              <div className="w-80 space-y-2.5 text-right font-bold text-xs bg-gray-50/60 p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between text-gray-400">
                  <span className="uppercase tracking-widest text-[9px]">EXCLUSIVE SUBTOTAL</span>
                  <span>{formatCurrency(details.subtotal)}</span>
                </div>
                {showVatSummary && (
                  <div className="flex justify-between text-gray-400">
                    <span className="uppercase tracking-widest text-[9px]">VAT COLLECTED (5%)</span>
                    <span>{formatCurrency(details.vatTotal)}</span>
                  </div>
                )}
                {details.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span className="uppercase tracking-widest text-[9px]">DISCOUNT REDUCTION</span>
                    <span>-{formatCurrency(details.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-gray-950 border-t border-gray-200 pt-3 mt-3">
                  <span className="uppercase tracking-tight text-[10px]">TOTAL PAYABLE</span>
                  <span className="text-[#C5A059] font-display text-lg leading-none">{formatCurrency(details.grandTotal)}</span>
                </div>
              </div>
            </div>

            {showSignature && (
              <div className="mt-20 border-t border-gray-100 pt-8 grid grid-cols-2 gap-8 text-xs font-bold uppercase tracking-wider">
                <div className="space-y-1 text-gray-400 text-[8px] leading-relaxed max-w-xs">
                  <p>{footerNote}</p>
                </div>
                <div className="flex flex-col items-end justify-end space-y-2">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">AUTHORIZED SIGNATORY</p>
                    <div className="w-44 h-12 border-b border-gray-200 mt-2" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div 
      ref={ref} 
      id="a4-print-area"
      className={`print-container p-12 bg-white text-black font-sans mx-auto shadow-2xl rounded-3xl ${getFontClass()} w-[210mm] min-h-[297mm] border border-gray-100 flex flex-col justify-between`}
      style={{ boxSizing: 'border-box' }}
    >
      <div>
        {renderA4Template()}
      </div>
      
      {/* Small mini-footer that displays the selected template system note */}
      <div className="text-[7px] text-gray-300 font-mono tracking-widest uppercase mt-12 text-center border-t border-gray-50 pt-4 flex justify-between">
        <span>Template: {selectedA4.toUpperCase()} Layout Suite</span>
        <span>Scent & Soul Registry Hub</span>
        <span>Secure ID: {details.number}</span>
      </div>
    </div>
  );
});

PrintTemplates.displayName = 'PrintTemplates';
