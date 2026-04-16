import React, { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesAPI, salesAPI, currenciesAPI, usersAPI, stocksAPI } from '../../../services/api';
import { Decimal } from 'decimal.js';
import toast from 'react-hot-toast';
import { FiChevronRight, FiChevronLeft, FiCheck, FiShoppingBag, FiUser, FiInfo, FiLayers } from 'react-icons/fi';

import Step1Customer from './Step1Customer';
import Step2Details from './Step2Details';
import Step3Cart from './Step3Cart';
import Step4Final from './Step4Final';
import { Party, Currency, User, SaleType, Item, Sale, CreateSaleDto } from '../../../types';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';

interface StockGroup {
  item: Item;
  details: {
    deptId: number;
    deptName: string;
    qty: string | number;
    itemCode: string;
  }[];
}

interface SalesWizardProps {
  onBack?: () => void;
  onCompleted: () => void;
}

const SalesWizard: React.FC<SalesWizardProps> = ({ onBack, onCompleted }) => {
  const queryClient = useQueryClient();
  const {
    step, setStep,
    partyId, setPartyId,
    customerSearch, setCustomerSearch,
    isCustomerDropdownOpen, setIsCustomerDropdownOpen,
    saleTypeId, setSaleTypeId,
    currencyId, setCurrencyId,
    deliveryDate, setDeliveryDate,
    repId, setRepId,
    invoiceType, setInvoiceType,
    cart, setCart,
    searchTerm, setSearchTerm,
    genDiscountType, setGenDiscountType,
    genDiscountValue, setGenDiscountValue,
    deposit, setDeposit,
    saleNotes, setSaleNotes,
    resetWizard,
    updateCartItem, removeCartItem, addToCart
  } = useSalesWizardStore();

  const totalSteps = 4;

  // ────── QUERIES ──────
  const { data: customersData } = useQuery({
    queryKey: ['parties', 'customers', customerSearch],
    queryFn: () => partiesAPI.getAll({ type: 'customer', search: customerSearch, limit: 10 }),
    enabled: step === 1 && customerSearch.length >= 2,
  });

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currenciesAPI.getAll(),
    enabled: step >= 2,
  });

  const { data: saleTypesData } = useQuery({
    queryKey: ['sale-types'],
    queryFn: () => salesAPI.getTypes(),
    enabled: step >= 2,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll({ limit: 100 }),
    enabled: step >= 2,
  });

  const { data: stocksData } = useQuery({
    queryKey: ['stocks', 'search', searchTerm],
    queryFn: () => stocksAPI.getAll({ search: searchTerm, limit: 50 }),
    enabled: step === 3 && searchTerm.length >= 2,
  });

  // ────── DERIVED DATA ──────
  const customers = (customersData?.data?.data as Party[]) || [];
  const selectedCustomer = customers.find(c => c.id === Number(partyId));
  const currencies = (currenciesData?.data as Currency[]) || [];
  const saleTypes = (saleTypesData?.data as SaleType[]) || [];
  const representatives = (usersData?.data?.data as User[]) || [];
  
  // Group stocks by item name
  const groupedStocks = useMemo(() => {
    const rawStocks = stocksData?.data?.data || [];
    const groups: Record<string, { item: any, details: any[] }> = {};
    
    rawStocks.forEach((s: any) => {
      const itemName = s.item?.name || 'Bilinmeyen Ürün';
      if (!groups[itemName]) {
        groups[itemName] = { item: s.item, details: [] };
      }
      groups[itemName].details.push({
        department: s.department?.name || 'Merkez',
        qty: s.quantity,
        reserved: s.reservedQuantity || 0
      });
    });
    return groups;
  }, [stocksData]);

  const searchResults = Object.keys(groupedStocks);

  const selectedCurrency = useMemo(() => 
    currencies.find(c => c.id === Number(currencyId)) || currencies.find(c => c.isDefault),
    [currencies, currencyId]
  );

  // ────── CALCULATIONS (HIGH PRECISION) ──────
  const finances = useMemo(() => {
    let rawTotalAmount = new Decimal(0);
    cart.forEach(c => {
      const price = new Decimal(c.price || 0);
      const qty = new Decimal(c.qty || 1);
      const discountVal = new Decimal(c.discountValue || 0);
      
      let netP = price;
      if (c.discountType === 'amount') {
        netP = price.sub(discountVal);
      } else if (c.discountType === 'percent') {
        netP = price.mul(new Decimal(1).sub(discountVal.div(100)));
      }
      rawTotalAmount = rawTotalAmount.add(qty.mul(netP));
    });

    const gDiscountNum = new Decimal(genDiscountValue || 0);
    let discountedTotalAmount = rawTotalAmount;
    if (genDiscountType === 'amount') {
      discountedTotalAmount = rawTotalAmount.sub(gDiscountNum);
    } else if (genDiscountType === 'percent') {
      discountedTotalAmount = rawTotalAmount.mul(new Decimal(1).sub(gDiscountNum.div(100)));
    }

    const avgKdvRate = cart.length > 0 ? new Decimal(cart[0].kdvRate || 20) : new Decimal(20);
    const totalKdv = discountedTotalAmount.mul(avgKdvRate.div(100));
    const grandTotal = discountedTotalAmount.add(totalKdv);
    const kaporaNum = new Decimal(deposit || 0);
    const netTotal = grandTotal.sub(kaporaNum);

    return {
      rawTotalAmount,
      discountedTotalAmount,
      totalKdv,
      grandTotal,
      kaporaNum,
      netTotal,
      gDiscountNum
    };
  }, [cart, genDiscountType, genDiscountValue, deposit]);

  // ────── MUTATIONS ──────
  const createMutation = useMutation({
    mutationFn: (dto: CreateSaleDto) => salesAPI.create(dto),
    onSuccess: () => {
      toast.success("Sipariş başarıyla oluşturuldu.");
      onCompleted();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Sipariş oluşturulamadı.");
    }
  });

  // ────── HANDLERS ──────
  const handleNext = () => setStep(step + 1);
  const handleBack = () => {
    if (step === 1 && onBack) onBack();
    else if (step > 1) setStep(step - 1);
  };

  const handleAddToCart = (group: StockGroup) => {
    if (cart.find(c => c.item.id === group.item.id)) {
      toast.error("Bu ürün zaten sepette.");
      return;
    }
    const totalQty = group.details.reduce((acc: number, d) => acc + Number(d.qty), 0);
    addToCart({ 
      item: group.item, 
      qty: 1, 
      price: group.item.salePrice || 0,
      discountValue: 0,
      discountType: 'percent',
      kdvRate: group.item.kdv || 20,
      maxQtyDesc: totalQty
    });
    setSearchTerm('');
    toast.success(`${group.item.name} eklendi.`);
  };

  const getStockAlert = (itemId: number, requestedQty: number) => {
    const itemName = cart.find(c => c.item.id === itemId)?.item?.name;
    const itemInStock = (itemName ? groupedStocks[itemName] : null) as StockGroup | null;
    const totalAvailable = itemInStock?.details.reduce((acc: number, d) => acc + Number(d.qty), 0) || 0;
    return { isOver: requestedQty > totalAvailable, totalAvailable };
  };

  const handleSubmit = () => {
    const dto: CreateSaleDto = {
      partyId: Number(partyId),
      saleTypeId: Number(saleTypeId),
      currencyId: Number(currencyId),
      deliveryDate,
      deposit: finances.kaporaNum.toString(),
      discountAmount: finances.gDiscountNum.toString(),
      discountPercent: genDiscountType === 'percent' ? genDiscountValue : '0',
      items: cart.map(c => ({
        itemId: c.item.id,
        quantity: c.qty.toString(),
        price: c.price.toString(),
        discountAmount: c.discountType === 'amount' ? c.discountValue.toString() : '0',
        discountPercent: c.discountType === 'percent' ? c.discountValue.toString() : '0',
        kdvRate: c.kdvRate.toString(),
        description: c.item.name
      })),
      notes: saleNotes
    };
    createMutation.mutate(dto);
  };

  // ────── RENDER HELPERS ──────
  const stepsConfig = [
    { label: 'Cari Seçimi', icon: <FiUser /> },
    { label: 'Detaylar', icon: <FiInfo /> },
    { label: 'Ürün Sepeti', icon: <FiShoppingBag /> },
    { label: 'Onay', icon: <FiCheck /> },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full py-4">
      {/* Premium Stepper */}
      <div className="flex justify-between items-center px-4 relative">
         <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0 mx-10" />
         {stepsConfig.map((s, i) => {
           const isCompleted = step > i + 1;
           const isActive = step === i + 1;
           return (
             <div key={i} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => step > i + 1 && setStep(i+1)}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                  isCompleted ? 'bg-success text-white' : isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-white text-slate-400 border border-slate-200'
                }`}>
                  {isCompleted ? <FiCheck size={18} /> : s.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-primary' : 'text-slate-400 opacity-60'}`}>
                  {s.label}
                </span>
             </div>
           );
         })}
      </div>

      {/* Main Wizard Area */}
      <div className="bg-white rounded-[2.5rem] shadow-premium p-8 lg:p-12 relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        {step === 1 && (
          <Step1Customer 
            partyId={partyId} setPartyId={setPartyId}
            customerSearch={customerSearch} setCustomerSearch={setCustomerSearch}
            isCustomerDropdownOpen={isCustomerDropdownOpen} setIsCustomerDropdownOpen={setIsCustomerDropdownOpen}
            filteredCustomers={customers} selectedCustomer={selectedCustomer}
            onNext={handleNext}
          />
        )}

        {step === 2 && (
          <Step2Details 
            partyId={partyId} customers={customers}
            saleTypeId={saleTypeId} setSaleTypeId={setSaleTypeId}
            currencyId={currencyId} setCurrencyId={setCurrencyId}
            deliveryDate={deliveryDate} setDeliveryDate={setDeliveryDate}
            repId={repId} setRepId={setRepId}
            invoiceType={invoiceType} setInvoiceType={setInvoiceType}
            saleTypes={saleTypes} currencies={currencies} representatives={representatives}
            today={new Date().toISOString().split('T')[0]}
            onBack={handleBack} onNext={handleNext}
          />
        )}

        {step === 3 && (
          <Step3Cart 
            cart={cart} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            searchResults={searchResults} groupedStocks={groupedStocks}
            handleAddToCart={handleAddToCart} updateCartItem={updateCartItem} removeCartItem={removeCartItem}
            getStockAlert={getStockAlert}
            selectedCurrencySymbol={selectedCurrency?.symbol || '₺'}
            onBack={handleBack} onNext={handleNext}
          />
        )}

        {step === 4 && (
          <Step4Final 
            selectedCurrencySymbol={selectedCurrency?.symbol || '₺'}
            genDiscountType={genDiscountType} setGenDiscountType={setGenDiscountType}
            genDiscountValue={genDiscountValue} setGenDiscountValue={setGenDiscountValue}
            deposit={deposit} setDeposit={setDeposit}
            saleNotes={saleNotes} setSaleNotes={setSaleNotes}
            finances={finances} isSubmitting={createMutation.isPending}
            onBack={handleBack} onSubmit={handleSubmit}
          />
        )}
      </div>

      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-50">
        ERMAY ERP PRO v2 • GÜVENLİ SATIŞ ALGORİTMASI ETKİN
      </p>
    </div>
  );
};

export default SalesWizard;
