import React, { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';

const PricingModal = ({ isOpen, session, onClose, onSave, isSaving }) => {
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [trainerShare, setTrainerShare] = useState('50');
  const [platformCommission, setPlatformCommission] = useState('50');
  const [error, setError] = useState('');
  const [enableWhatsApp, setEnableWhatsApp] = useState(true);
  const [whatsappTemplateName, setWhatsappTemplateName] = useState('');
  const [whatsappCustomTitle, setWhatsappCustomTitle] = useState('');
  const [whatsappButtonUrl, setWhatsappButtonUrl] = useState('');

  useEffect(() => {
    if (session) {
      setPrice('');
      setCurrency(session.currency || 'INR');
      setTrainerShare(String(session.trainerSharePercentage ?? 50));
      setPlatformCommission(String(session.platformCommissionPercentage ?? 50));
      setError('');
      setEnableWhatsApp(session.enableWhatsApp ?? true);
      setWhatsappTemplateName(session.whatsappTemplateName ?? '');
      setWhatsappCustomTitle(session.whatsappCustomTitle ?? '');
      setWhatsappButtonUrl(session.whatsappButtonUrl ?? '');
    }
  }, [session, isOpen]);

  const handleTrainerShareChange = (val) => {
    setTrainerShare(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setPlatformCommission(String(100 - num));
    }
  };

  const handlePlatformCommissionChange = (val) => {
    setPlatformCommission(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setTrainerShare(String(100 - num));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid non-negative price.');
      return;
    }

    const tShare = Number(trainerShare);
    const pComm = Number(platformCommission);
    if (isNaN(tShare) || isNaN(pComm) || tShare < 0 || pComm < 0 || (tShare + pComm) !== 100) {
      setError('Split matrix must sum up to exactly 100%.');
      return;
    }

    onSave({
      price: parsedPrice,
      currency,
      trainerSharePercentage: tShare,
      platformCommissionPercentage: pComm,
      enableWhatsApp,
      whatsappTemplateName,
      whatsappCustomTitle,
      whatsappButtonUrl,
    });
  };

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="relative bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-slate-100 p-8 space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">Set Pricing & Publish</h2>
              <p className="text-xs text-slate-400 mt-0.5">Define pricing & split commission model</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Session Details */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Name</p>
          <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{session.title || session.classTitle}</h3>
          <p className="text-xs text-slate-500">
            Instructor: <span className="font-semibold text-slate-700">{session.trainerName || session.instructor || 'N/A'}</span>
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Price & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-sm font-semibold">
                  {currency === 'INR' ? '₹' : '$'}
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 499"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPrice(val);
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) {
                      setEnableWhatsApp(parsed === 0);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full pl-8 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-705 disabled:opacity-50"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer font-semibold text-slate-705 disabled:opacity-50"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Trainer Share & Platform Commission */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Trainer Share (%)
              </label>
              <div className="relative">
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={trainerShare}
                  onChange={(e) => handleTrainerShareChange(e.target.value)}
                  disabled={isSaving}
                  className="w-full pr-8 pl-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-705 disabled:opacity-50"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 text-xs font-bold">%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Platform Comm (%)
              </label>
              <div className="relative">
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={platformCommission}
                  onChange={(e) => handlePlatformCommissionChange(e.target.value)}
                  disabled={isSaving}
                  className="w-full pr-8 pl-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-705 disabled:opacity-50"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 text-xs font-bold">%</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-normal">
            * Note: Price will be converted to subunits (paisa/cents) for secure gateway processing. Entering 0 configures this session as a **Free Session**.
          </p>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 cursor-pointer">
              <input
                name="enableWhatsApp"
                type="checkbox"
                checked={enableWhatsApp}
                onChange={(e) => setEnableWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold">Enable WhatsApp Reminders</span>
            </label>

            {enableWhatsApp && (
              <div className="space-y-3 pl-2 border-l-2 border-blue-100">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Template Name Override
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. lurnstack_custom"
                    value={whatsappTemplateName}
                    onChange={(e) => setWhatsappTemplateName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Custom Title Override
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced JS Masterclass"
                    value={whatsappCustomTitle}
                    onChange={(e) => setWhatsappCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Button URL/Path Override
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. js-course"
                    value={whatsappButtonUrl}
                    onChange={(e) => setWhatsappButtonUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-200 disabled:text-slate-450 disabled:shadow-none flex items-center gap-1.5"
            >
              {isSaving ? 'Saving & Publishing...' : 'Save & Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PricingModal;
