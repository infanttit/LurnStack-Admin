import React from 'react';
import { StatusBadge } from '../components/Shared';
import { formatCurrency } from '../utils';

const RefundAdjustments = ({ refunds }) => (
  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 p-4">
      <h2 className="font-bold text-slate-900">Refund Adjustment View</h2>
      <p className="text-sm text-slate-500">Unpaid earnings are reduced immediately. Paid earnings are carried into a future payout adjustment.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Trainer</th>
            <th className="px-4 py-3">Session</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Earning State</th>
            <th className="px-4 py-3">Adjustment</th>
            <th className="px-4 py-3">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {refunds.map((refund) => (
            <tr key={refund.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold">{refund.trainerName}</td>
              <td className="px-4 py-3">{refund.sessionTitle}</td>
              <td className="px-4 py-3"><code className="rounded bg-slate-100 px-2 py-1 text-xs">{refund.paymentId}</code></td>
              <td className="px-4 py-3 font-semibold text-rose-700">{formatCurrency(refund.amount)}</td>
              <td className="px-4 py-3"><StatusBadge status={refund.earningStatus} /></td>
              <td className="px-4 py-3"><StatusBadge status={refund.adjustmentState} /></td>
              <td className="px-4 py-3 text-slate-600">{refund.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default RefundAdjustments;
