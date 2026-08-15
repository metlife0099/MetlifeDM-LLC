import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal.jsx';
import { Input, Textarea, Select } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { cn } from '@/utils/format.js';

const PHONE_US = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

const schema = z.object({
  firstName: z.string().trim().min(2, 'At least 2 characters'),
  lastName: z.string().trim().min(2, 'At least 2 characters'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().regex(PHONE_US, 'Enter a valid US phone number').optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  budget: z.string().optional(),
  message: z.string().max(3000).optional().or(z.literal('')),
});

const BUDGET_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: '<5k', label: 'Under $5k' },
  { value: '5k-10k', label: '$5k – $10k' },
  { value: '10k-25k', label: '$10k – $25k' },
  { value: '25k-50k', label: '$25k – $50k' },
  { value: '50k-100k', label: '$50k – $100k' },
  { value: '100k+', label: '$100k+' },
  { value: 'undecided', label: 'Not sure yet' },
];

/**
 * Shared "ask about this pricing" form, opened from every pricing page
 * (Growth Solutions, SEO, Google Ads, Social Growth, Pricing, Projects,
 * Customer Service, PASCO, Diagnostic, Control). `service` and `plan`
 * identify what the visitor was looking at when they opened it, so every
 * enquiry lands in one admin queue regardless of which page it came from.
 */
export default function PricingEnquiryModal({ open, onClose, service, plan }) {
  const [inquirerType, setInquirerType] = useState('customer');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) setInquirerType('customer');
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data) =>
      leadsApi.submitPricingEnquiry({
        ...data,
        inquirerType,
        service,
        plan: plan || undefined,
      }),
    onSuccess: () => {
      toast.success("Thanks! We'll get back to you shortly.");
      reset();
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const onSubmit = (data) => {
    const payload = { ...data };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') delete payload[key];
    });
    mutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enquire about pricing"
      description={plan ? `${service} — ${plan}` : service}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Customer vs agency */}
        <div>
          <span className="text-eyebrow block mb-2">I am a</span>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'customer', label: 'Customer', icon: User, desc: 'Buying for my own business' },
              { value: 'agency', label: 'Agency', icon: Building2, desc: "I'm buying on behalf of a client" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setInquirerType(opt.value)}
                className={cn(
                  'flex items-start gap-3 p-4 border text-left transition-colors duration-300',
                  inquirerType === opt.value ? 'border-ink bg-sand' : 'border-hairline hover:border-ink'
                )}
              >
                <opt.icon size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <span>
                  <span className="text-sm font-medium block">{opt.label}</span>
                  <span className="text-slate text-xs">{opt.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="First name *" {...register('firstName')} error={errors.firstName?.message} />
          <Input label="Last name *" {...register('lastName')} error={errors.lastName?.message} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Work email *" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label={inquirerType === 'agency' ? 'Company / agency name' : 'Company (optional)'}
            {...register('company')}
            error={errors.company?.message}
          />
          <Select label="Budget (optional)" options={BUDGET_OPTIONS} {...register('budget')} />
        </div>

        <Textarea
          label="What would you like to know? (optional)"
          rows={3}
          placeholder="Tell us anything that'll help us reply with the right answer."
          {...register('message')}
          error={errors.message?.message}
        />

        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="w-full justify-center"
        >
          {mutation.isPending ? 'Sending…' : 'Send enquiry'}
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </Button>
        <p className="text-slate text-xs text-center leading-relaxed">
          By submitting, you agree to be contacted about your enquiry. We never share your info.
        </p>
      </form>
    </Modal>
  );
}
