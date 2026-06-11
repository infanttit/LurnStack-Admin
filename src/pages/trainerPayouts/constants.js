import {
  ClipboardCheck,
  FileCheck2,
  History,
  ReceiptIndianRupee,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

export const MIN_PAYOUT = 50000;
export const PRICING_PAGE_SIZE = 8;
export const PAGE_NOTE = 'Manual bank transfer flow only. RazorpayX and automated payouts are not part of Phase 1.';

export const payoutTabs = [
  { id: 'earnings', label: 'Earnings', icon: ReceiptIndianRupee },
  { id: 'pricing', label: 'Pricing', icon: SlidersHorizontal },
  { id: 'accounts', label: 'Accounts', icon: ShieldCheck },
  { id: 'requests', label: 'Payout Requests', icon: ClipboardCheck },
  { id: 'complete', label: 'Manual Completion', icon: FileCheck2 },
  { id: 'refunds', label: 'Refund Adjustments', icon: RefreshCcw },
  { id: 'audit', label: 'Audit Log', icon: History },
];
