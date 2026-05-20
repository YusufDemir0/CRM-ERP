import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { itemsAPI } from '../../services/api';
import { FormField } from '../common/FormField';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';

interface ItemTypeFormProps {
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
}

export const ItemTypeForm: React.FC<ItemTypeFormProps> = ({ onSuccess, onCancel }) => {
  const { register, handleSubmit } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clearCache } = useQuickCreateStore();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await itemsAPI.createItemType({
        name: data.name.toUpperCase(),
      });
      toast.success('Ürün türü başarıyla eklendi.');
      clearCache('item-type_create');
      onSuccess(res.data);
    } catch (error: unknown) {
      let errorMsg = 'Ürün türü eklenirken hata oluştu.';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
        if (response?.data?.message) {
          errorMsg = Array.isArray(response.data.message) ? response.data.message[0] : response.data.message;
        }
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormField label="Ürün Türü (Örn: Hammadde, Mamul)" required>
        <input 
          required 
          className="input-premium uppercase-input font-bold" 
          {...register('name')} 
          placeholder="MAMUL" 
        />
      </FormField>

      <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-slate-100">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-[var(--primary-glow)]">
          {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={20} />} 
          ÜRÜN TÜRÜNÜ KAYDET
        </button>
        <button type="button" disabled={isSubmitting} className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200" onClick={onCancel}>
          İPTAL
        </button>
      </div>
    </form>
  );
};
