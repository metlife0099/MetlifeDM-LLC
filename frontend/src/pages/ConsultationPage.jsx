import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, Video, ArrowUpRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Input, Textarea, Select, Checkbox } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { BUDGET_OPTIONS, TIMELINE_OPTIONS, SERVICE_CATEGORIES } from '@/utils/constants.js';
import { cn, formatDate } from '@/utils/format.js';

const consultationSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  company: z.string().optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  role: z.string().optional(),
  preferredDate: z.string().min(1, 'Pick a date'),
  preferredTimeSlot: z.string().min(1, 'Pick a time'),
  timezone: z.string().default('America/New_York'),
  durationMinutes: z.number().default(30),
  meetingType: z.enum(['google_meet', 'zoom', 'phone', 'in_person']).default('google_meet'),
  servicesInterested: z.array(z.string()).optional(),
  projectGoals: z.string().min(10, 'Tell us a bit about your goals'),
  budget: z.string().optional(),
  urgency: z.enum(['immediate', '1-3_months', '3-6_months', 'exploring']).default('exploring'),
  additionalNotes: z.string().optional(),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms' }) }),
});

// Generate next 14 available business days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  let d = new Date(today);
  d.setDate(d.getDate() + 1);
  while (dates.length < 10) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

const MEETING_TYPES = [
  { value: 'google_meet', label: 'Google Meet', icon: Video },
  { value: 'zoom', label: 'Zoom', icon: Video },
  { value: 'phone', label: 'Phone', icon: Clock },
];

export default function ConsultationPage() {
  const dates = generateDates();
  const [selectedDate, setSelectedDate] = useState(dates[0].toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [meetingType, setMeetingType] = useState('google_meet');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      timezone: 'America/New_York',
      durationMinutes: 30,
      meetingType: 'google_meet',
      urgency: 'exploring',
      servicesInterested: [],
    },
  });

  const services = watch('servicesInterested') || [];

  const mutation = useMutation({
    mutationFn: leadsApi.bookConsultation,
    onSuccess: () => {
      toast.success("Consultation booked. Check your email for confirmation.");
      reset();
      setSelectedTime('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const onSubmit = (data) => {
    // eslint-disable-next-line no-unused-vars
    const { agreeTerms, ...payload } = data;
    if (!payload.website) delete payload.website;
    payload.preferredDate = selectedDate;
    payload.preferredTimeSlot = selectedTime;
    payload.meetingType = meetingType;
    mutation.mutate(payload);
  };

  const toggleService = (val) => {
    const next = services.includes(val)
      ? services.filter((s) => s !== val)
      : [...services, val];
    setValue('servicesInterested', next);
  };

  const pickDate = (d) => {
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
    setValue('preferredDate', iso);
  };

  const pickTime = (t) => {
    setSelectedTime(t);
    setValue('preferredTimeSlot', t);
  };

  return (
    <>
      <Seo title="Book a consultation" description="Book a free 30-minute strategy call with MetlifeDM's senior strategists. No pitch — just a plan." />

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Eyebrow number="00">Consultation / 30-minute strategy call</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl">
            Book a strategy call.<br />
            <span className="text-italic-fraunces text-ultra">No pitch. Just a plan.</span>
          </h1>
          <p className="text-slate text-lg mt-8 max-w-xl leading-relaxed">
            A senior strategist reviews your funnel, benchmarks your competitors, and gives you 3 actionable next steps — for free, in 30 minutes.
          </p>

          {/* What to expect */}
          <div className="mt-14 grid gap-px bg-hairline border border-hairline md:grid-cols-4">
            {[
              { icon: '01', title: 'Send brief', body: 'Fill out the form. Takes 2 minutes.' },
              { icon: '02', title: 'Get calendar invite', body: 'Confirmation & Meet link within 1 hour.' },
              { icon: '03', title: 'Have the call', body: '30-min diagnostic with a senior strategist.' },
              { icon: '04', title: 'Get a plan', body: '3 concrete next steps you can execute today.' },
            ].map((s) => (
              <div key={s.icon} className="bg-ivory p-6">
                <div className="num-plate text-slate text-xs mb-3">{s.icon}</div>
                <h3 className="text-display-sm mb-2">{s.title}</h3>
                <p className="text-slate text-xs leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid gap-14 lg:grid-cols-[1.2fr_1fr]"
          >
            {/* Left: form fields */}
            <div className="space-y-10">
              <div>
                <Eyebrow number="01">About you</Eyebrow>
                <div className="mt-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input label="First name *" {...register('firstName')} error={errors.firstName?.message} />
                    <Input label="Last name *" {...register('lastName')} error={errors.lastName?.message} />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input label="Work email *" type="email" {...register('email')} error={errors.email?.message} />
                    <Input label="Phone *" type="tel" {...register('phone')} error={errors.phone?.message} />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input label="Company" {...register('company')} error={errors.company?.message} />
                    <Input label="Your role" {...register('role')} error={errors.role?.message} />
                  </div>
                  <Input label="Website" type="url" placeholder="https://" {...register('website')} error={errors.website?.message} />
                </div>
              </div>

              <div>
                <Eyebrow number="02">Your goals</Eyebrow>
                <div className="mt-6 space-y-6">
                  <Textarea
                    label="What are you trying to grow? *"
                    rows={5}
                    placeholder="Revenue targets, current bottlenecks, what you've tried before…"
                    {...register('projectGoals')}
                    error={errors.projectGoals?.message}
                  />

                  <div>
                    <span className="text-eyebrow block mb-3">Services of interest</span>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_CATEGORIES.slice(0, 8).map((s) => {
                        const active = services.includes(s.value);
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => toggleService(s.value)}
                            className={cn(
                              'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors',
                              active ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                            )}
                          >
                            <span className="mr-1.5">{s.icon}</span>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Select
                    label="Estimated budget"
                    {...register('budget')}
                    error={errors.budget?.message}
                    options={[{ value: '', label: 'Select…' }, ...BUDGET_OPTIONS]}
                  />

                  <Select
                    label="How soon are you looking to start?"
                    {...register('urgency')}
                    error={errors.urgency?.message}
                    options={TIMELINE_OPTIONS}
                  />

                  <Textarea
                    label="Anything else?"
                    rows={3}
                    placeholder="Optional. Anything a strategist should know before the call?"
                    {...register('additionalNotes')}
                  />
                </div>
              </div>
            </div>

            {/* Right: scheduling */}
            <div className="lg:sticky lg:top-32 lg:self-start space-y-8">
              <div>
                <Eyebrow number="03">Pick a date</Eyebrow>
                <div className="mt-6 grid grid-cols-5 gap-2">
                  {dates.map((d) => {
                    const iso = d.toISOString().split('T')[0];
                    const active = selectedDate === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => pickDate(d)}
                        className={cn(
                          'p-3 border text-center transition-colors',
                          active ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                        )}
                      >
                        <div className="text-mono text-[0.65rem] uppercase tracking-widest opacity-60">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-display-sm mt-1 num-plate">
                          {d.getDate()}
                        </div>
                        <div className="text-mono text-[0.65rem] uppercase tracking-widest opacity-60 mt-1">
                          {d.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.preferredDate && (
                  <div className="text-mono text-xs text-danger mt-2">{errors.preferredDate.message}</div>
                )}
              </div>

              <div>
                <Eyebrow number="04">Pick a time (EST)</Eyebrow>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => pickTime(t)}
                      className={cn(
                        'p-3 border text-mono text-xs uppercase tracking-widest transition-colors',
                        selectedTime === t
                          ? 'bg-ink text-ivory border-ink'
                          : 'border-hairline hover:border-ink'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {errors.preferredTimeSlot && (
                  <div className="text-mono text-xs text-danger mt-2">{errors.preferredTimeSlot.message}</div>
                )}
              </div>

              <div>
                <Eyebrow number="05">Meeting type</Eyebrow>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {MEETING_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMeetingType(value)}
                      className={cn(
                        'p-4 border flex flex-col items-center gap-2 transition-colors',
                        meetingType === value
                          ? 'bg-ink text-ivory border-ink'
                          : 'border-hairline hover:border-ink'
                      )}
                    >
                      <Icon size={18} strokeWidth={1.25} />
                      <span className="text-mono text-[0.65rem] uppercase tracking-widest">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary card */}
              {selectedTime && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-ultra bg-ultra-tint p-6"
                >
                  <div className="text-mono text-xs uppercase tracking-widest text-ultra mb-3 flex items-center gap-2">
                    <Check size={12} strokeWidth={2} />
                    Selected
                  </div>
                  <div className="text-display-sm">
                    {formatDate(selectedDate, 'long')}
                  </div>
                  <div className="text-mono text-sm text-ink mt-2">
                    {selectedTime} EST · 30 minutes · {MEETING_TYPES.find((m) => m.value === meetingType)?.label}
                  </div>
                </motion.div>
              )}

              <Checkbox
                label={
                  <>
                    I agree to MetlifeDM&apos;s{' '}
                    <a href="/privacy" className="link-underline text-ink">privacy policy</a>.
                  </>
                }
                {...register('agreeTerms')}
                error={errors.agreeTerms?.message}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Booking…' : 'Confirm consultation'}
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
            </div>
          </motion.form>
        </Container>
      </Section>
    </>
  );
}
