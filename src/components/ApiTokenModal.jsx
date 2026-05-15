import React, { useEffect, useState } from 'react';
import { authTokenStorage } from '../api/axiosClient';

const ApiTokenModal = ({ open, onClose }) => {
  const [tokenDraft, setTokenDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    setTokenDraft(authTokenStorage.get());
  }, [open]);

  if (!open) return null;

  const saveToken = () => {
    authTokenStorage.set(tokenDraft.trim());
    onClose?.();
  };

  const clearToken = () => {
    setTokenDraft('');
    authTokenStorage.clear();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">API Token</h2>
            <p className="text-sm text-gray-500 mt-1">Stored locally in your browser.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Close
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bearer Token</label>
            <input
              type="password"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Paste token here"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-2">Used for admin API authorization.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={clearToken}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={saveToken}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTokenModal;

