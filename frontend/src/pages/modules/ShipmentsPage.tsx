import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiPackage, FiTruck, FiCheckCircle, FiXCircle, 
  FiMapPin, FiCalendar, FiDownload, FiSearch, FiRefreshCw, FiX, FiTrash 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { shipmentsAPI, vehiclesAPI } from '../../services/api';
import { confirmDialog } from '../../utils/confirmDialog';

export default function ShipmentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Vehicle management states
  const [showVehicleManagement, setShowVehicleManagement] = useState(false);
  const [newVehName, setNewVehName] = useState('');
  const [newVehPlate, setNewVehPlate] = useState('');
  const [newVehDesc, setNewVehDesc] = useState('');

  // Fetch shipments
  const { data: shipmentsData, isLoading, isFetching } = useQuery({
    queryKey: ['shipments', 'list', page, statusFilter, searchTerm],
    queryFn: async () => {
      const res = await shipmentsAPI.getAll({
        page,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      });
      return res.data;
    },
  });

  // Fetch metrics & route pooling info
  const { data: metricsData } = useQuery({
    queryKey: ['shipments', 'metrics'],
    queryFn: async () => {
      const res = await shipmentsAPI.getMetrics();
      return res.data;
    },
  });

  // Fetch vehicles for vehicle management
  const { data: vehiclesList = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await vehiclesAPI.getAll();
      return res.data || [];
    },
    enabled: showVehicleManagement
  });

  const shipments = shipmentsData?.data || [];
  const meta = shipmentsData?.meta || { total: 0, totalPages: 1 };
  
  const statusCounts = metricsData?.statusCounts || { pending: 0, shipped: 0, completed: 0, cancelled: 0 };
  const routePooling = metricsData?.routePooling || [];

  // Mutations
  const dispatchMutation = useMutation({
    mutationFn: ({ id, carrierNameOrPlate }: { id: string | number; carrierNameOrPlate: string }) => 
      shipmentsAPI.dispatch(id, { carrierNameOrPlate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Sevkiyat yola çıkarıldı (Sevk Edildi).');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Sevkiyat yola çıkarılamadı.');
    }
  });

  const completeMutation = useMutation({
    mutationFn: (id: string | number) => shipmentsAPI.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Sevkiyat başarıyla tamamlandı ve stoklar düşüldü.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Sevkiyat tamamlanamadı.');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string | number) => shipmentsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Sevkiyat iptal edildi, rezervasyonlar geri alındı.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Sevkiyat iptal edilemedi.');
    }
  });

  const handleDispatchDirect = async (id: string | number) => {
    if (await confirmDialog('Bu sevkiyatı yola çıkarmak istiyor musunuz?', false)) {
      dispatchMutation.mutate({ id, carrierNameOrPlate: '' });
    }
  };

  const handleComplete = async (id: string | number) => {
    if (await confirmDialog('Bu sevkiyatı teslim edilmiş olarak tamamlamak ve stokları eksiltmek istiyor musunuz?', false)) {
      completeMutation.mutate(id);
    }
  };

  const handleCancel = async (id: string | number) => {
    if (await confirmDialog('Bu sevkiyatı ve bağlı siparişi iptal etmek, stok rezervasyonlarını geri almak istiyor musunuz?', true)) {
      cancelMutation.mutate(id);
    }
  };

  // Excel Downloads
  const downloadRouteReport = async (city?: string, district?: string) => {
    try {
      const res = await shipmentsAPI.exportExcel({ city, district });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = city && district 
        ? `Sevkiyat_Rota_${city.toUpperCase()}_${district.toUpperCase()}.xlsx`
        : 'Sevkiyat_Konsolide_Rota_Raporu.xlsx';
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Rota bazlı konsolide rapor indirildi.');
    } catch (error) {
      toast.error('Excel raporu indirilirken hata oluştu.');
    }
  };

  const downloadAllReport = async () => {
    try {
      const res = await shipmentsAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Tüm_Sevkiyatlar_Raporu.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Tüm sevkiyatlar raporu indirildi.');
    } catch (error) {
      toast.error('Rapor indirilirken hata oluştu.');
    }
  };

  const downloadTodayReport = async () => {
    try {
      const res = await shipmentsAPI.exportExcel({ today: 'true' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Gün_İçi_Sevkiyat_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Gün içi sevkiyat havuz raporu indirildi.');
    } catch (error) {
      toast.error('Rapor indirilirken hata oluştu.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; dotClass: string }> = {
      pending: { label: 'BEKLEYEN', className: 'bg-slate-100 text-slate-600 border border-slate-200', dotClass: 'bg-slate-400' },
      shipped: { label: 'YOLDA', className: 'bg-amber-50 text-amber-600 border border-amber-100', dotClass: 'bg-amber-500 animate-pulse' },
      completed: { label: 'TAMAMLANDI', className: 'bg-emerald-50 text-emerald-600 border border-emerald-100', dotClass: 'bg-emerald-500' },
      cancelled: { label: 'İPTAL EDİLDİ', className: 'bg-rose-50 text-rose-600 border border-rose-100', dotClass: 'bg-rose-500' },
    };
    const current = statusMap[status] || { label: status.toUpperCase(), className: 'bg-slate-50 text-slate-400 border border-slate-200', dotClass: 'bg-slate-400' };
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${current.className}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${current.dotClass}`} />
        {current.label}
      </div>
    );
  };

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiTruck /> SEVKİYAT HAREKETLERİ & PLANLAMA
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Sevkiyat <span className="text-primary">Takip & Planlama</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowVehicleManagement(true)}
            className="h-11 px-5 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md shadow-teal-100/50"
          >
            <FiTruck /> Araç Yönetimi
          </button>
          <button 
            onClick={downloadTodayReport}
            className="h-11 px-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md shadow-indigo-100/50"
          >
            <FiDownload /> Gün İçi Raporu İndir
          </button>
          <button 
            onClick={downloadAllReport}
            className="h-11 px-5 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
          >
            <FiDownload /> Tüm Raporu İndir
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bekleyen Sevkiyatlar</span>
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
              <FiPackage size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 tabular-nums">{statusCounts.pending || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Yoldaki Araçlar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <FiTruck size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tabular-nums">{statusCounts.shipped || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Tamamlanan Teslimat</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <FiCheckCircle size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tabular-nums">{statusCounts.completed || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">İptal Edilenler</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <FiXCircle size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 tabular-nums">{statusCounts.cancelled || 0}</div>
        </div>
      </div>

      {/* ROTUE POOLING & CONSOLIDATION WIDGET (Commented out as requested by the user) */}
      {/* 
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-96 h-96 bg-primary/20 blur-[100px] rounded-full opacity-60" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FiMapPin size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Rota Havuzu & Sevkiyat Birleştirme</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Aynı ilçeye giden yükleri eşleştirin</p>
            </div>
          </div>

          {routePooling.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider py-4">Havuzda eşleşen aktif sevk rotası bulunamadı.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {routePooling.map((route: any, i: number) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div>
                    <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                      {route.deliveryCity}
                    </span>
                    <h4 className="text-sm font-black tracking-tight mt-1">{route.deliveryDistrict}</h4>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">{route.count} Aktif Sevkiyat</p>
                  </div>
                  <button 
                    onClick={() => downloadRouteReport(route.deliveryCity, route.deliveryDistrict)}
                    className="p-3 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl transition-all shadow-sm"
                    title="Bu Rotanın Konsolide Raporunu İndir"
                  >
                    <FiDownload size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      */}

      {/* FILTER & TABLE SECTION */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        
        {/* FILTERS */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
          <div className="flex overflow-x-auto bg-slate-50 p-1 rounded-2xl border border-slate-100 scrollbar-none">
            {([
              { id: 'all' as const, label: 'TÜMÜ' },
              { id: 'pending' as const, label: 'BEKLEYEN SEVK TALEPLERİ' },
              { id: 'shipped' as const, label: 'YOLA ÇIKAN SEVKLER' },
              { id: 'completed' as const, label: 'TAMAMLANAN SEVK TALEPLERİ' },
              { id: 'cancelled' as const, label: 'İPTAL EDİLEN SEVK TALEPLERİ' }
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className={`h-9 px-4 rounded-xl text-[10px] font-black whitespace-nowrap uppercase tracking-widest transition-all ${
                  statusFilter === tab.id 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Şehir, İlçe veya Belge No Ara..."
              className="h-11 pl-12 pr-6 rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-100 focus:border-primary outline-none text-xs font-bold transition-all w-full lg:w-72 shadow-inner"
            />
          </div>
        </div>

        {/* SHIPMENT TABLE */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Sevkiyatlar Yükleniyor...</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-300">
              <FiPackage size={48} className="stroke-[1.5]" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Aranan kriterlere uygun sevkiyat bulunamadı.</span>
            </div>
          ) : (
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-3.5 rounded-l-xl">İşlem No</th>
                  <th className="px-4 py-3.5">Bağlı Sipariş / Müşteri</th>
                  <th className="px-4 py-3.5">Çıkış Deposu</th>
                  <th className="px-4 py-3.5">Teslimat Adresi</th>
                  <th className="px-4 py-3.5">Araç & Sorumlu</th>
                  <th className="px-4 py-3.5">Sevk Onay Tarihi</th>
                  <th className="px-4 py-3.5">Teslimat Tarihi / Deadline</th>
                  <th className="px-4 py-3.5">Durum</th>
                  <th className="px-4 py-3.5 text-center rounded-r-xl">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {shipments.map((item: any) => {
                  const isPending = item.status === 'pending';
                  const isShipped = item.status === 'shipped';
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* SHIPMENT CODE */}
                      <td className="px-4 py-4">
                        <span className="font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          SEV#{String(item.id).padStart(5, '0')}
                        </span>
                      </td>

                      {/* SIPARIS / CARI */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 tracking-tight">{item.sale?.code || 'SİPARİŞ YOK'}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.sale?.party?.name || 'BELİRTİLMEMİŞ'}</span>
                        </div>
                      </td>

                      {/* DEPO */}
                      <td className="px-4 py-4 font-black text-slate-700 uppercase tracking-tighter">
                        {item.outgoingDepartment?.name || 'GENEL DEPO'}
                      </td>

                      {/* SEHIR / ILCE / ADRES */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                              {item.deliveryCity}
                            </span>
                            <span className="font-extrabold text-slate-700 uppercase">{item.deliveryDistrict}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 max-w-[200px] truncate mt-1" title={item.deliveryAddress}>
                            {item.deliveryAddress}
                          </span>
                        </div>
                      </td>

                      {/* ARAC & SORUMLU */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          {item.vehicles && item.vehicles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.vehicles.map((v: any) => (
                                <span key={v.id} className="font-black text-[10px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg uppercase tracking-tight" title={v.name}>
                                  🚗 {v.plate}
                                </span>
                              ))}
                            </div>
                          ) : item.carrierNameOrPlate ? (
                            <span className="font-black text-[10px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg uppercase tracking-tight">
                              {item.carrierNameOrPlate}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Araç Yok</span>
                          )}

                          {item.assignedStaff && item.assignedStaff.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {item.assignedStaff.map((s: any) => (
                                <span key={s.id} className="font-bold text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded uppercase tracking-tight">
                                  👤 {s.firstName} {s.lastName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* SEVK ONAY TARIHI */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <FiCalendar />
                          <span>{item.approvedAt || item.createdAt ? new Date(item.approvedAt || item.createdAt).toLocaleDateString('tr-TR') : '—'}</span>
                        </div>
                      </td>

                      {/* TERMIN / TESLIMAT TARIHI */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <FiCalendar />
                          <span>{item.deadline ? new Date(item.deadline).toLocaleDateString('tr-TR') : '—'}</span>
                        </div>
                      </td>

                      {/* DURUM */}
                      <td className="px-4 py-4">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* EYLEMLER */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <>
                              <button 
                                onClick={() => handleDispatchDirect(item.id)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                Yola Çıkar
                              </button>
                              <button 
                                onClick={() => handleCancel(item.id)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                İptal Et
                              </button>
                            </>
                          )}

                          {isShipped && (
                            <>
                              <button 
                                onClick={() => handleComplete(item.id)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                Teslim Et
                              </button>
                              <button 
                                onClick={() => handleCancel(item.id)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                İptal Et
                              </button>
                            </>
                          )}

                          {!isPending && !isShipped && (
                            <span className="text-slate-300 italic text-[11px]">Pasif</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!isLoading && meta.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Toplam {meta.total} kayıttan {((page - 1) * 20) + 1} - {Math.min(page * 20, meta.total)} arası gösteriliyor
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-650 disabled:hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Önceki
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${
                    page === p ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-650 disabled:hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🟣 VEHICLE MANAGEMENT MODAL */}
      {showVehicleManagement && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white max-w-[600px] w-[95%] p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col gap-6 text-slate-800 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FiTruck className="text-primary" /> Araç Yönetimi
              </h2>
              <button 
                onClick={() => setShowVehicleManagement(false)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Add vehicle subform */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yeni Araç Ekle</h4>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Araç Adı (örn: Ford Transit)"
                  value={newVehName}
                  onChange={e => setNewVehName(e.target.value)}
                  className="h-10 px-3 text-xs border border-slate-200 rounded-xl bg-white"
                />
                <input 
                  type="text" 
                  placeholder="Plaka (örn: 34 DEF 456)"
                  value={newVehPlate}
                  onChange={e => setNewVehPlate(e.target.value)}
                  className="h-10 px-3 text-xs border border-slate-200 rounded-xl bg-white"
                />
              </div>
              <input 
                type="text" 
                placeholder="Açıklama (Opsiyonel)"
                value={newVehDesc}
                onChange={e => setNewVehDesc(e.target.value)}
                className="h-10 px-3 text-xs border border-slate-200 rounded-xl bg-white"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newVehName || !newVehPlate) {
                    toast.error("Araç adı ve plaka alanları zorunludur.");
                    return;
                  }
                  try {
                    await vehiclesAPI.create({ name: newVehName, plate: newVehPlate, description: newVehDesc });
                    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                    toast.success("Araç başarıyla eklendi.");
                    setNewVehName('');
                    setNewVehPlate('');
                    setNewVehDesc('');
                  } catch (e: any) {
                    toast.error(e.response?.data?.message || "Araç eklenemedi.");
                  }
                }}
                className="h-10 w-full text-xs font-black bg-primary text-white rounded-xl hover:brightness-110"
              >
                KAYDET VE EKLE
              </button>
            </div>

            {/* List vehicles with delete buttons */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mevcut Araç Listesi</h4>
              {vehiclesLoading ? (
                <div className="py-4 text-center text-xs text-slate-400 font-bold uppercase animate-pulse">Yükleniyor...</div>
              ) : vehiclesList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-350 italic font-bold">Kayıtlı araç bulunmuyor.</div>
              ) : (
                vehiclesList.map((v: any) => (
                  <div key={v.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-800 text-sm">{v.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">{v.plate}</div>
                    </div>
                    <button
                      onClick={async () => {
                        if (await confirmDialog("Bu aracı silmek istediğinize emin misiniz?", true)) {
                          try {
                            await vehiclesAPI.delete(v.id);
                            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                            toast.success("Araç silindi.");
                          } catch (e: any) {
                            toast.error("Araç silinemedi.");
                          }
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 rounded-lg border border-rose-100 transition-colors"
                      title="Sil"
                    >
                      <FiTrash size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowVehicleManagement(false)}
                className="h-11 px-6 bg-slate-100 hover:bg-slate-200 text-xs font-black rounded-2xl transition-all"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
