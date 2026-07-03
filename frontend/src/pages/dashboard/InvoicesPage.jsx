import { useQuery } from '@tanstack/react-query';
import { Download, Receipt } from 'lucide-react';
import { commerceApi } from '@/api/index.js';
import { DashHeader, DashEmpty } from '@/components/dashboard/DashHeader.jsx';
import { Spinner, Badge } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney, formatDate } from '@/utils/format.js';

export default function InvoicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments', 'mine'],
    queryFn: () => commerceApi.listMyPayments({ limit: 30 }),
  });
  const payments = data?.data || [];

  return (
    <>
      <Seo title="Invoices" noindex />
      <DashHeader
        eyebrow="Billing / Invoices"
        title={<>Your <span className="text-italic-fraunces text-ultra">receipts.</span></>}
        subtitle="Every payment we've processed, with downloadable receipts."
      />

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
      ) : payments.length === 0 ? (
        <DashEmpty
          title="No invoices yet"
          subtitle="Your paid orders will show up here as invoices."
        />
      ) : (
        <div className="divide-editorial border-t border-hairline">
          {payments.map((p) => (
            <div key={p._id} className="py-6 grid gap-6 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div>
                <div className="text-mono text-xs uppercase tracking-widest text-slate">{p.invoiceNumber}</div>
                <div className="text-sm mt-1">
                  {p.description || `Payment for ${p.order?.orderNumber || 'order'}`}
                </div>
              </div>
              <div className="text-mono text-xs text-slate uppercase tracking-widest">
                {formatDate(p.paidAt || p.createdAt, 'short')}
              </div>
              <div className="text-mono text-sm">{formatMoney(p.amount)}</div>
              <div className="flex items-center gap-3">
                <Badge tone={p.status === 'succeeded' ? 'success' : p.status === 'refunded' ? 'default' : 'ultra'}>
                  {p.status}
                </Badge>
                {p.receiptUrl && (
                  <Button
                    as="a"
                    href={p.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                    size="sm"
                  >
                    <Download size={12} strokeWidth={1.5} />
                    Receipt
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
