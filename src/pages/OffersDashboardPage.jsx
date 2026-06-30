import React, { useEffect, useState, useMemo } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  Gift
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  fetchCategoriesApi, 
  fetchActiveOffersApi, 
  createOfferApi, 
  deleteOfferApi, 
  uploadPosterApi,
  fetchPostersApi,
  deletePosterApi
} from '../api/offers';
import { getApiErrorMessage, resolveAssetUrl } from '../api/axiosClient';

const OffersDashboardPage = () => {
  // Data state
  const [categories, setCategories] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [submittingPoster, setSubmittingPoster] = useState(false);
  const [errorOffers, setErrorOffers] = useState('');

  // Discount Rule Form State
  const [ruleForm, setRuleForm] = useState({
    title: '',
    categoryId: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    expiryDate: ''
  });

  // Poster Form State
  const [posterFile, setPosterFile] = useState(null);
  const [posterCategory, setPosterCategory] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  // Deletion confirm state
  const [deletingId, setDeletingId] = useState(null);

  // Poster list and delete state
  const [posters, setPosters] = useState([]);
  const [loadingPosters, setLoadingPosters] = useState(true);
  const [deletingPosterId, setDeletingPosterId] = useState(null);

  // Fetch initial data
  useEffect(() => {
    loadCategories();
    loadOffers();
    loadPosters();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await fetchCategoriesApi();
      setCategories(data);
      if (data.length > 0) {
        setRuleForm(prev => ({ ...prev, categoryId: data[0].id }));
        setPosterCategory(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadOffers = async () => {
    setLoadingOffers(true);
    setErrorOffers('');
    try {
      const response = await fetchActiveOffersApi();
      // Handle array or wrapped response
      const list = Array.isArray(response) ? response : response?.data || response?.offers || [];
      setActiveOffers(list);
    } catch (err) {
      setErrorOffers('Failed to retrieve active promotions');
      console.error(err);
    } finally {
      setLoadingOffers(false);
    }
  };

  // Auto-generate a beautiful coupon title if the user has not entered one
  const computedTitle = useMemo(() => {
    if (ruleForm.title.trim()) return ruleForm.title;
    const selectedCat = categories.find(c => c.id === ruleForm.categoryId);
    const categoryName = selectedCat ? selectedCat.name : 'All Courses';
    const value = ruleForm.discountValue ? ruleForm.discountValue : 'Special';
    if (ruleForm.discountType === 'percentage') {
      return `${value}% OFF on ${categoryName}`;
    } else if (ruleForm.discountType === 'flat') {
      return `₹${value} OFF on ${categoryName}`;
    } else {
      return `₹${value} Cashback on ${categoryName}`;
    }
  }, [ruleForm, categories]);

  // Form Submission for Discount Rules
  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!ruleForm.categoryId || !ruleForm.discountValue || !ruleForm.startDate || !ruleForm.expiryDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmittingOffer(true);
    try {
      const finalTitle = ruleForm.title.trim() || computedTitle;
      const payload = {
        title: finalTitle,
        ruleTitle: finalTitle,
        category: ruleForm.categoryId,
        categoryId: ruleForm.categoryId,
        discountType: ruleForm.discountType,
        discountValue: Number(ruleForm.discountValue),
        startDate: ruleForm.startDate,
        expiryDate: ruleForm.expiryDate,
        endDate: ruleForm.expiryDate
      };

      const result = await createOfferApi(payload);
      if (result.success || result.data || result.offer) {
        toast.success('Discount rule created successfully!');
        // Reset form except category default
        setRuleForm({
          title: '',
          categoryId: categories[0]?.id || '',
          discountType: 'percentage',
          discountValue: '',
          startDate: '',
          expiryDate: ''
        });
        loadOffers();
      } else {
        toast.error('Unexpected server response.');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create discount rule'));
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Drag and Drop handlers for poster upload
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setPosterFile(file);
        setFilePreview(URL.createObjectURL(file));
      } else {
        toast.error('Only image files are allowed for poster banners.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPosterFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Form Submission for Poster Banner
  const handlePosterSubmit = async (e) => {
    e.preventDefault();
    if (!posterFile) {
      toast.error('Please select or drop a banner image.');
      return;
    }
    if (!posterCategory) {
      toast.error('Please link the poster to a course category.');
      return;
    }

    setSubmittingPoster(true);
    try {
      const categoryName = getCategoryName(posterCategory);
      const formData = new FormData();
      formData.append('image', posterFile);
      formData.append('category', posterCategory);
      formData.append('categoryId', posterCategory);
      formData.append('title', `Banner - ${categoryName}`);
      formData.append('linkUrl', `/categories/${posterCategory}`);
      formData.append('startsAt', new Date().toISOString());
      formData.append('endsAt', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());
      formData.append('isActive', 'true');

      const result = await uploadPosterApi(formData);
      if (result.success || result.data) {
        toast.success('Promotional poster uploaded successfully!');
        setPosterFile(null);
        setFilePreview(null);
        loadPosters();
      } else {
        toast.error('Failed to upload poster banner.');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to upload banner poster'));
    } finally {
      setSubmittingPoster(false);
    }
  };

  const loadPosters = async () => {
    setLoadingPosters(true);
    try {
      const data = await fetchPostersApi();
      setPosters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosters(false);
    }
  };

  const handleDeletePoster = async (id) => {
    try {
      await deletePosterApi(id);
      toast.success('Promotional poster deleted successfully.');
      setDeletingPosterId(null);
      loadPosters();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete promotional poster'));
    }
  };

  // Delete Offer Handlers
  const handleDeleteOffer = async (id) => {
    try {
      await deleteOfferApi(id);
      toast.success('Promotion rule deleted successfully.');
      setDeletingId(null);
      loadOffers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete promotion'));
    }
  };

  // Helper to determine status and render beautiful badges
  const getOfferStatus = (startDate, expiryDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);

    if (now > expiry) {
      return { 
        label: 'Expired', 
        classes: 'bg-red-50 text-red-700 border-red-100', 
        icon: AlertCircle 
      };
    }
    if (now < start) {
      return { 
        label: 'Scheduled', 
        classes: 'bg-amber-50 text-amber-700 border-amber-100', 
        icon: Clock 
      };
    }
    return { 
      label: 'Active', 
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
      icon: CheckCircle2 
    };
  };

  // Helper to format currency/percent values nicely
  const formatDiscountVal = (type, value) => {
    if (type === 'percentage') return `${value}% Off`;
    if (type === 'flat') return `₹${value} Off`;
    return `₹${value} Cashback`;
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => String(c.id) === String(catId));
    return cat ? cat.name : 'General Category';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header gradient banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 shadow-lg border border-slate-800 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-indigo-500/15 blur-2xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5" />
              Promotions Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-50">
              Offers & Campaigns Manager
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Design category-based pricing adjustments, define custom student rewards, and upload high-converting banners directly linked to course selections.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[100px]">
              <span className="block text-2xl font-bold text-blue-400">{activeOffers.length}</span>
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Rules</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[100px]">
              <span className="block text-2xl font-bold text-emerald-400">
                {activeOffers.filter(o => getOfferStatus(o.startDate, o.expiryDate || o.endDate).label === 'Active').length}
              </span>
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Create Offers Rule */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Tag className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Configure Discount Rule</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Create rules targeting dynamic pricing across specific learning categories.
            </p>

            <form onSubmit={handleOfferSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Rule Title <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Summer Monsoon Special"
                  value={ruleForm.title}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Target Category
                  </label>
                  {loadingCategories ? (
                    <div className="h-10 bg-slate-100 animate-pulse rounded-xl"></div>
                  ) : (
                    <select
                      value={ruleForm.categoryId}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={ruleForm.discountType}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    <option value="percentage">Percentage OFF</option>
                    <option value="flat">Flat Amount OFF</option>
                    <option value="cashback">Wallet Cashback</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Discount Value ({ruleForm.discountType === 'percentage' ? '%' : '₹'})
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-semibold text-sm">
                    {ruleForm.discountType === 'percentage' ? '%' : '₹'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={ruleForm.discountType === 'percentage' ? '15' : '1000'}
                    value={ruleForm.discountValue}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={ruleForm.startDate}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={ruleForm.expiryDate}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingOffer}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50 active:scale-95 mt-2"
              >
                {submittingOffer ? 'Saving Promotion...' : 'Publish Discount Rule'}
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Premium Preview Coupon Area */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Live Promo Ticket Preview</h3>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-5 text-white shadow-md">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 rounded-full bg-white/10 blur-xl"></div>
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider w-fit">
                    <Gift className="w-3 h-3" />
                    Lurnstack Offer
                  </div>
                  <h4 className="text-lg font-bold tracking-tight line-clamp-1">
                    {computedTitle}
                  </h4>
                  <p className="text-[11px] text-blue-100 font-medium">
                    Category: <span className="underline">{getCategoryName(ruleForm.categoryId)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-black tracking-tight leading-none text-amber-300">
                    {ruleForm.discountValue ? (ruleForm.discountType === 'percentage' ? `${ruleForm.discountValue}%` : `₹${ruleForm.discountValue}`) : '-%'}
                  </span>
                  <span className="text-[9px] text-blue-100 font-bold uppercase tracking-wider">
                    {ruleForm.discountType === 'percentage' ? 'Discount' : ruleForm.discountType === 'flat' ? 'Flat Off' : 'Cashback'}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-3 text-[10px] text-blue-100 font-semibold">
                <span>Start: {ruleForm.startDate ? new Date(ruleForm.startDate).toLocaleDateString() : 'YYYY-MM-DD'}</span>
                <span>Ends: {ruleForm.expiryDate ? new Date(ruleForm.expiryDate).toLocaleDateString() : 'YYYY-MM-DD'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Upload Promotional Poster */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Upload Promotional Poster</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Publish image banners to display on student endpoints, linking clicks to specific courses.
            </p>

            <form onSubmit={handlePosterSubmit} className="space-y-5">
              {/* Drag and Drop Zone */}
              <div
                className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/20' 
                    : filePreview 
                      ? 'border-slate-200 bg-slate-50/30' 
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="poster-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {filePreview ? (
                  <div className="space-y-3">
                    <img 
                      src={filePreview} 
                      alt="Banner Preview" 
                      className="mx-auto max-h-36 rounded-lg object-contain shadow-sm border border-slate-200" 
                    />
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 truncate max-w-xs">{posterFile?.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPosterFile(null);
                          setFilePreview(null);
                        }}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="poster-input" className="cursor-pointer space-y-3 block">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">
                        Drag and drop file, or <span className="text-blue-600 hover:underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-400">Supports PNG, JPG, JPEG (Recommended: 1200 x 400px)</p>
                    </div>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Link Redirection Category
                </label>
                {loadingCategories ? (
                  <div className="h-10 bg-slate-100 animate-pulse rounded-xl"></div>
                ) : (
                  <select
                    value={posterCategory}
                    onChange={(e) => setPosterCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                )}
                <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
                  Clicking the promotional banner on student portals will redirect to the selected course category collection.
                </p>
              </div>

              <button
                type="submit"
                disabled={submittingPoster}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50 active:scale-95 mt-2"
              >
                {submittingPoster ? 'Uploading Banner...' : 'Upload Promotional Poster'}
                <Upload className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Premium Preview Poster Area */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Live Banner Redirection Preview</h3>
            <div className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 h-32 flex items-center justify-center text-slate-400 shadow-inner">
              {filePreview ? (
                <>
                  <img src={filePreview} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white px-4 text-center">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-600 px-2 py-0.5 rounded font-extrabold uppercase">
                        Action Link
                      </span>
                      <p className="text-xs font-bold truncate max-w-sm">Redirects to lurnstack.com/categories/{posterCategory}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-1 p-4">
                  <ImageIcon className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                  <p className="text-xs font-bold text-slate-400">No poster image selected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Active Rules Table */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Active Discount Rules</h3>
            <p className="text-sm text-slate-500 mt-0.5">List of live, scheduled, and expired category-wide discount rules.</p>
          </div>
          
          <button 
            type="button" 
            onClick={loadOffers}
            disabled={loadingOffers}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
          >
            {loadingOffers ? 'Refreshing...' : 'Sync Rules'}
          </button>
        </div>

        <div className="p-6">
          {loadingOffers ? (
            <div className="py-12 text-center text-slate-400 space-y-2 animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs font-semibold">Updating live promotions...</p>
            </div>
          ) : errorOffers ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorOffers}</span>
            </div>
          ) : activeOffers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-slate-400 space-y-2">
              <Gift className="w-8 h-8 mx-auto text-slate-300" />
              <div>
                <p className="text-sm font-bold text-slate-700">No active promotions</p>
                <p className="text-xs text-slate-400">Configure discount parameters above to launch category campaigns.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                    <th className="px-6 py-4 rounded-l-2xl">Rule Title</th>
                    <th className="px-6 py-4">Target Category</th>
                    <th className="px-6 py-4">Discount Value</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4 text-center rounded-r-2xl w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeOffers.map((offer) => {
                    const status = getOfferStatus(offer.startDate, offer.expiryDate || offer.endDate);
                    const StatusIcon = status.icon;
                    const offerId = offer.id || offer._id;
                    
                    return (
                      <tr key={offerId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{offer.title || offer.ruleTitle || 'Special Promo'}</td>
                        <td className="px-6 py-4 font-medium text-slate-500">
                          {getCategoryName(offer.category || offer.categoryId)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-blue-600">
                            {formatDiscountVal(offer.discountType, offer.discountValue)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${status.classes}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-500">
                          {offer.expiryDate || offer.endDate ? new Date(offer.expiryDate || offer.endDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {deletingId === offerId ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteOffer(offerId)}
                                className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingId(offerId)}
                              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              aria-label="Delete rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banners Grid */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Uploaded Promotional Banners</h3>
            <p className="text-sm text-slate-500 mt-0.5">Manage the live image banners displayed on the student portal slider.</p>
          </div>
          
          <button 
            type="button" 
            onClick={loadPosters}
            disabled={loadingPosters}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
          >
            {loadingPosters ? 'Refreshing...' : 'Sync Banners'}
          </button>
        </div>

        <div className="p-6">
          {loadingPosters ? (
            <div className="py-12 text-center text-slate-400 space-y-2 animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs font-semibold">Loading banners...</p>
            </div>
          ) : posters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-slate-400 space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
              <div>
                <p className="text-sm font-bold text-slate-700">No banners uploaded</p>
                <p className="text-xs text-slate-400">Upload a promotional poster banner on the right side above.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posters.map((poster) => {
                const posterId = poster.id || poster._id;
                const imageUrl = resolveAssetUrl(poster.imageUrl);
                return (
                  <div key={posterId} className="group relative rounded-2xl border border-slate-100 bg-slate-50/30 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="relative aspect-[3/1] bg-slate-100 overflow-hidden">
                      <img src={imageUrl} alt={poster.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                          poster.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {poster.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{poster.title}</h4>
                        <p className="text-xs font-semibold text-indigo-600 truncate">
                          Category: {getCategoryName(poster.categoryId || poster.category)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Ends: {poster.endsAt ? new Date(poster.endsAt).toLocaleDateString() : '-'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100/50 mt-2">
                        <span className="text-[10px] text-slate-400 font-medium">ID: {posterId}</span>
                        {deletingPosterId === posterId ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeletePoster(posterId)}
                              className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPosterId(null)}
                              className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingPosterId(posterId)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OffersDashboardPage;
