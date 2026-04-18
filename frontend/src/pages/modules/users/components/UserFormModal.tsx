import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Department, Role } from '../../../../types';

interface UserFormSubmitPayload {
  fullName: string;
  username: string;
  password?: string;
  departmentId: string;
  phone: string;
  email: string;
  fullPhone: string;
  selectedRoles: number[];
}

interface UserFormInitialData {
  fullName?: string;
  username?: string;
  password?: string;
  departmentId?: string;
  phone?: string;
  email?: string;
  selectedRoles?: number[];
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: UserFormSubmitPayload) => void;
  editingId: number | null;
  initialData: UserFormInitialData;
  departments: Department[];
  availableRoles: Role[];
}

type UserFormData = {
  fullName: string;
  username: string;
  password?: string;
  departmentId: string;
  phone: string;
  email: string;
};

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  initialData,
  departments,
  availableRoles,
}) => {
  const [countryCode, setCountryCode] = useState('+90');
  const [selectedRoles, setSelectedRoles] = useState<number[]>(initialData.selectedRoles || []);

  const { register, handleSubmit, reset } = useForm<UserFormData>({
    defaultValues: {
      fullName: initialData.fullName || '',
      username: initialData.username || '',
      password: '',
      departmentId: initialData.departmentId || '',
      phone: initialData.phone ? (initialData.phone.startsWith('+90 ') ? initialData.phone.substring(4) : initialData.phone) : '',
      email: initialData.email || '',
    }
  });

  useEffect(() => {
    let newPhone = initialData.phone || '';
    if (newPhone.startsWith('+90 ')) {
      setCountryCode('+90');
      newPhone = newPhone.substring(4);
    }
    reset({
      fullName: initialData.fullName || '',
      username: initialData.username || '',
      password: '',
      departmentId: initialData.departmentId || '',
      phone: newPhone,
      email: initialData.email || '',
    });
    setSelectedRoles(initialData.selectedRoles || []);
  }, [initialData, reset]);

  const formatPhone = (val: string) => {
    let d = val.replace(/\D/g, '');
    if (d.startsWith('0')) d = d.substring(1);
    d = d.substring(0, 10);
    let res = '';
    if (d.length > 0) res += d.substring(0, 3);
    if (d.length > 3) res += ' ' + d.substring(3, 6);
    if (d.length > 6) res += ' ' + d.substring(6, 8);
    if (d.length > 8) res += ' ' + d.substring(8, 10);
    return res;
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const onFormSubmit: SubmitHandler<UserFormData> = (data) => {
    onSubmit({
      ...data,
      fullName: data.fullName.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR'),
      username: data.username.toLowerCase().replace(/\s/g, ''),
      email: data.email.toLowerCase(),
      phone: formatPhone(data.phone),
      fullPhone: `${countryCode} ${formatPhone(data.phone)}`,
      selectedRoles
    });
  };

  if (!isOpen) return null;

  return (
    <div className="loader-overlay items-start pt-[3%] overflow-y-auto">
      <div className="login-box max-w-[800px] w-full mb-[5%]">
        <h3 className="mb-5 text-primary border-b border-border pb-2.5">
          {editingId ? 'Personel Güncelle' : 'Sisteme Personel Ekle'}
        </h3>
        <form onSubmit={handleSubmit(onFormSubmit)} className="login-form">
          <div className="grid grid-cols-[2fr_1fr] gap-8">
            {/* SOL TARAF: KİŞİ BİLGİLERİ */}
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label>Personel Ad Soyad</label>
                <input
                  required
                  className="uppercase-input"
                  {...register('fullName')}
                  placeholder="ÖR: AHMET YILMAZ"
                />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label>Sistem Kullanıcı Adı</label>
                  <input
                    required
                    className="uppercase-input lowercase"
                    {...register('username')}
                    placeholder="ahmety"
                    disabled={!!editingId}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>
                    Sistem Şifresi {editingId && <span className="text-[9px] text-red-500">(Boş=Aynı)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    className="uppercase-input normal-case"
                    {...register('password')}
                    placeholder="****"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label>Departman *</label>
                  <select
                    required
                    className="uppercase-input"
                    {...register('departmentId')}
                  >
                    <option value="">Lütfen Seçiniz</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Telefon *</label>
                  <div className="flex gap-1.5">
                    <select
                      required
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="uppercase-input w-20 px-2 py-3 appearance-none text-center"
                    >
                      <option value="+90">+90</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+49">+49</option>
                    </select>
                    <input
                      required
                      className="uppercase-input tabular-nums flex-1"
                      {...register('phone', {
                        onChange: (e) => { e.target.value = formatPhone(e.target.value) }
                      })}
                      placeholder="5XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Kurumsal E-Posta (Opsiyonel)</label>
                <input
                  type="email"
                  className="uppercase-input lowercase"
                  {...register('email')}
                  placeholder="personel@sirket.com"
                />
              </div>
            </div>

            {/* SAĞ TARAF: ROL ATAMA */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-border">
              <label className="text-[13px] text-primary font-extrabold mb-2.5 block">Rolsüz Kullanıcı Eklenemez.</label>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto">
                {availableRoles.map((r) => (
                  <label key={r.id} className="flex items-center gap-2.5 text-[13px] cursor-pointer bg-white p-2.5 rounded-lg border border-slate-300">
                    <input type="checkbox" checked={selectedRoles.includes(r.id)} onChange={() => handleRoleToggle(r.id)} />
                    <strong>{r.name}</strong>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button type="submit" className="btn btn-primary flex-1 h-[50px]" disabled={selectedRoles.length === 0}>
              {editingId ? 'BİLGİLERİ GÜNCELLE' : 'KULLANICI OLUŞTUR VE YETKİLERİ ATA'}
            </button>
            <button type="button" className="btn bg-slate-200 flex-[0.5] h-[50px]" onClick={onClose}>
              İPTAL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
