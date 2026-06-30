import { axiosClient } from './axiosClient';

const FALLBACK_CATEGORIES = [
  { id: 'tech-programming', name: 'Tech & Programming' },
  { id: 'business-marketing', name: 'Business & Marketing' },
  { id: 'design-creativity', name: 'Design & Creativity' },
  { id: 'photography-visual', name: 'Photography & Visual Arts' },
  { id: 'personal-development', name: 'Personal Development' }
];

export const fetchCategoriesApi = async () => {
  let apiCategories = [];

  try {
    const response = await axiosClient.get('/api/admin/categories');
    const data = response?.data?.data || response?.data || [];
    if (Array.isArray(data) && data.length > 0) {
      apiCategories = data.map(cat => ({
        id: String(cat.slug || cat.id || cat._id || cat.categoryId || cat.value || ''),
        name: cat.name || cat.title || cat.categoryName || 'Unnamed Category'
      })).filter(cat => cat.id);
    }
  } catch (err) {
    console.warn('Failed to fetch from /api/admin/categories directly, trying target definitions:', err);
  }

  if (apiCategories.length === 0) {
    try {
      const targetsResponse = await axiosClient.get('/api/admin/offer-targets');
      const targets = targetsResponse?.data?.data || targetsResponse?.data || {};
      const categories = targets.categories || targets.parentCategories || [];
      if (Array.isArray(categories) && categories.length > 0) {
        apiCategories = categories.map(cat => ({
          id: String(cat.slug || cat.id || cat._id || cat.categoryId || cat.value || ''),
          name: cat.name || cat.title || cat.categoryName || 'Unnamed Category'
        })).filter(cat => cat.id);
      }
    } catch (err) {
      console.warn('Failed to fetch from /api/admin/offer-targets as fallback:', err);
    }
  }

  // Merge API results with student-side fallback categories, avoiding duplicates
  const merged = [...apiCategories];
  FALLBACK_CATEGORIES.forEach(fall => {
    const exists = merged.some(
      m => String(m.id).toLowerCase() === String(fall.id).toLowerCase() || 
           m.name.toLowerCase() === fall.name.toLowerCase()
    );
    if (!exists) {
      merged.push(fall);
    }
  });

  return merged;
};

const normalizeOffer = (offer) => {
  if (!offer) return offer;
  return {
    ...offer,
    id: offer.id || offer._id,
    title: offer.title || offer.ruleTitle || 'Promo Rule',
    categoryId: offer.targetCategoryId || offer.categoryId || '',
    category: offer.targetCategoryId || offer.categoryId || '',
    discountType: String(offer.discountType || 'PERCENTAGE').toLowerCase(),
    discountValue: Number(offer.discountValue || 0),
    startDate: offer.startsAt ? new Date(offer.startsAt).toISOString().split('T')[0] : '',
    expiryDate: offer.endsAt ? new Date(offer.endsAt).toISOString().split('T')[0] : '',
    endDate: offer.endsAt ? new Date(offer.endsAt).toISOString().split('T')[0] : ''
  };
};

export const fetchActiveOffersApi = async () => {
  try {
    const response = await axiosClient.get('/api/admin/offers');
    const list = Array.isArray(response?.data) ? response.data : response?.data?.data || response?.data?.offers || [];
    return list.map(normalizeOffer);
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      console.warn('GET /api/admin/offers is not implemented (404/405). Loading local state.');
      try {
        const stored = localStorage.getItem('lurnstack_local_offers');
        const list = stored ? JSON.parse(stored) : [];
        return list.map(normalizeOffer);
      } catch {
        return [];
      }
    }
    throw error;
  }
};

export const createOfferApi = async (payload) => {
  // Translate to database prisma model structure
  const backendPayload = {
    title: payload.title,
    discountType: String(payload.discountType || 'percentage').toUpperCase() === 'PERCENTAGE' ? 'PERCENTAGE' :
                  String(payload.discountType).toUpperCase() === 'FLAT' || String(payload.discountType).toUpperCase() === 'FLAT_AMOUNT' ? 'FLAT_AMOUNT' : 'CASHBACK',
    discountValue: Number(payload.discountValue),
    offerType: 'CATEGORY_WIDE',
    targetCategoryId: payload.categoryId || payload.category || null,
    targetCourseId: null,
    startsAt: new Date(payload.startDate || payload.startsAt).toISOString(),
    endsAt: new Date(payload.expiryDate || payload.endDate || payload.endsAt).toISOString(),
    isActive: true
  };

  try {
    const response = await axiosClient.post('/api/admin/offers', backendPayload);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      console.warn('POST /api/admin/offers is not implemented. Saving to local state.');
      try {
        const stored = localStorage.getItem('lurnstack_local_offers');
        const list = stored ? JSON.parse(stored) : [];
        const newOffer = {
          ...payload,
          id: `local_${Date.now()}`,
          _id: `local_${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        list.push(newOffer);
        localStorage.setItem('lurnstack_local_offers', JSON.stringify(list));
        return { success: true, offer: newOffer, data: newOffer };
      } catch (err) {
        throw error;
      }
    }
    throw error;
  }
};

export const deleteOfferApi = async (id) => {
  if (String(id).startsWith('local_')) {
    try {
      const stored = localStorage.getItem('lurnstack_local_offers');
      if (stored) {
        let list = JSON.parse(stored);
        list = list.filter(item => (item.id || item._id) !== id);
        localStorage.setItem('lurnstack_local_offers', JSON.stringify(list));
      }
      return { success: true };
    } catch (err) {
      console.error(err);
    }
  }

  try {
    const response = await axiosClient.delete(`/api/admin/offers/${encodeURIComponent(id)}`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      console.warn('DELETE /api/admin/offers is not implemented. Removing from local state if exists.');
      try {
        const stored = localStorage.getItem('lurnstack_local_offers');
        if (stored) {
          let list = JSON.parse(stored);
          list = list.filter(item => (item.id || item._id) !== id);
          localStorage.setItem('lurnstack_local_offers', JSON.stringify(list));
        }
        return { success: true };
      } catch (err) {
        throw error;
      }
    }
    throw error;
  }
};

export const uploadPosterApi = async (formData) => {
  try {
    const response = await axiosClient.post('/api/admin/promos/posters', formData);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      console.warn('POST /api/admin/promos/posters is not implemented. Mocking successful upload in local environment.');
      return { success: true, data: { status: 'mocked_upload' } };
    }
    throw error;
  }
};

export const fetchPostersApi = async () => {
  try {
    const response = await axiosClient.get('/api/admin/promos/posters');
    return response.data?.data || response.data || [];
  } catch (error) {
    // If admin endpoint doesn't exist, try public one
    try {
      const response = await axiosClient.get('/api/promos/posters');
      return response.data?.data || response.data || [];
    } catch {
      return [];
    }
  }
};

export const deletePosterApi = async (id) => {
  try {
    const response = await axiosClient.delete(`/api/admin/promos/posters/${encodeURIComponent(id)}`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      console.warn('DELETE /api/admin/promos/posters/:id is not implemented. Mocking delete.');
      return { success: true };
    }
    throw error;
  }
};

