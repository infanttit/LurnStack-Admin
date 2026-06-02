import React from 'react';
import { BadgePercent, Pencil } from 'lucide-react';
import { Metric } from './Fields';
import { statusStyles } from './constants';

export const CampaignsView = ({ campaigns, onCreate, onEdit, onDelete }) => (
  <section className="rounded-xl border border-slate-200 bg-white">
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Campaign Workspace</h2>
        <p className="mt-1 text-sm text-slate-500">Manage drafts, ready campaigns, and sent campaign records.</p>
      </div>
      <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
        <BadgePercent className="h-4 w-4" />
        New Campaign
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-white text-xs uppercase text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">Campaign</th>
            <th className="px-5 py-3 font-semibold">Target</th>
            <th className="px-5 py-3 font-semibold">Recipients</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Updated</th>
            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {campaigns.map((campaign) => (
            <tr key={campaign.id}>
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-900">{campaign.name}</p>
                <p className="mt-1 text-xs text-slate-500">{campaign.offerTitle}</p>
              </td>
              <td className="px-5 py-4 text-slate-600">{campaign.target}</td>
              <td className="px-5 py-4 text-slate-600">{campaign.recipients}</td>
              <td className="px-5 py-4">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[campaign.status] || statusStyles.Draft}`}>{campaign.status}</span>
              </td>
              <td className="px-5 py-4 text-slate-600">{campaign.updatedAt}</td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => onEdit(campaign)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-400">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button type="button" onClick={() => onDelete(campaign.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold text-red-600 hover:border-red-400">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export const HistoryView = ({ history, onCreate }) => (
  <section className="rounded-xl border border-slate-200 bg-white">
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Delivery History</h2>
        <p className="mt-1 text-sm text-slate-500">ZeptoMail delivery results will appear here after backend integration.</p>
      </div>
      <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
        <BadgePercent className="h-4 w-4" />
        New Campaign
      </button>
    </div>
    <div className="divide-y divide-slate-100">
      {history.map((item) => (
        <article key={item.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div>
            <h3 className="font-semibold text-slate-900">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.sentAt}</p>
          </div>
          <Metric label="Recipients" value={item.recipients} />
          <Metric label="Sent" value={item.sent} tone="green" />
          <Metric label="Failed" value={item.failed} tone={item.failed ? 'red' : 'slate'} />
        </article>
      ))}
    </div>
  </section>
);
