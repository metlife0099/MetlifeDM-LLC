import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Input, Textarea, Select, Checkbox } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { BUDGET_OPTIONS, TIMELINE_OPTIONS, SERVICE_CATEGORIES, SITE } from '@/utils/constants.js';

const PHONE_US = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

const contactSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(PHONE_US, 'Enter a valid US phone number').optional().or(z.literal('')),
  company: z.string().optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  subject: z.string().min(3, 'At least 3 characters'),
  message: z.string().min(10, 'Tell us a bit more'),
  budget: z.string().optional(),
  servicesInterested: z.array(z.string()).optional(),
  timeline: z.string().optional(),
  howHeardAboutUs: z.string().optional(),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms' }) }),
});

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { servicesInterested: [] },
  });

  const services = watch('servicesInterested') || [];

  const mutation = useMutation({
    mutationFn: leadsApi.submitContact,
    onSuccess: () => {
      toast.success("Message sent. We'll reply within one business day.");
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const onSubmit = (data) => {
    // eslint-disable-next-line no-unused-vars
    const { agreeTerms, ...payload } = data;
    // Unfilled optional fields (empty Select/Input) come through as "" —
    // strip them so the backend's optional/enum validators see them as
    // absent rather than an invalid empty-string value.
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') delete payload[key];
    });
    mutation.mutate(payload);
  };

  const toggleService = (val) => {
    const next = services.includes(val)
      ? services.filter((s) => s !== val)
      : [...services, val];
    setValue('servicesInterested', next);
  };

  return (
    <>
      <Seo title="Contact" description="Get in touch with MetlifeDM. We respond to every inquiry within one business day." />

      {/* Hero */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80&auto=format&fit=crop"
          alt="Getting in touch"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Contact / Let&apos;s talk</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Start the<br />
            <span className="text-italic-fraunces text-ultra-soft">conversation.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Tell us about your business. We&apos;ll get back within one business day with next steps or thoughtful questions — no auto-responders, no drip campaigns.
          </p>
        </Container>
      </Section>

      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1fr_2fr]">
            {/* Contact info sidebar */}
            <div>
              <div className="space-y-10 lg:sticky lg:top-32">
                <div>
                  <Eyebrow number="01">Direct</Eyebrow>
                  <div className="mt-6 space-y-6">
                    <a href="mailto:hello@metlifedm.com" className="flex items-start gap-4 group">
                      <Mail size={20} strokeWidth={1.25} className="text-ultra mt-0.5 shrink-0" />
                      <div>
                        <div className="text-mono text-xs uppercase tracking-widest text-slate">Email</div>
                        <div className="text-sm mt-1 group-hover:text-ultra transition-colors">hello@metlifedm.com</div>
                      </div>
                    </a>
                    <a href="tel:+18005550199" className="flex items-start gap-4 group">
                      <Phone size={20} strokeWidth={1.25} className="text-ultra mt-0.5 shrink-0" />
                      <div>
                        <div className="text-mono text-xs uppercase tracking-widest text-slate">Phone</div>
                        <div className="text-sm mt-1 group-hover:text-ultra transition-colors">+1 (800) 555-0199</div>
                      </div>
                    </a>
                    <div className="flex items-start gap-4">
                      <MapPin size={20} strokeWidth={1.25} className="text-ultra mt-0.5 shrink-0" />
                      <div>
                        <div className="text-mono text-xs uppercase tracking-widest text-slate">Office</div>
                        <div className="text-sm mt-1">{SITE.city}</div>
                        <div className="text-mono text-xs text-slate mt-1">Mon–Fri · 9am–6pm EST</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Eyebrow number="02">Prefer a call?</Eyebrow>
                  <p className="text-slate text-sm mt-6 leading-relaxed">
                    Skip the form and book a 30-minute strategy call directly on our calendar.
                  </p>
                  <Button to="/consultation" variant="ghost" className="mt-6">
                    Book a call <ArrowUpRight size={14} strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <Input label="First name *" {...register('firstName')} error={errors.firstName?.message} />
                <Input label="Last name *" {...register('lastName')} error={errors.lastName?.message} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
                <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Input label="Company" {...register('company')} error={errors.company?.message} />
                <Input label="Website" type="url" placeholder="https://" {...register('website')} error={errors.website?.message} />
              </div>

              <Input label="Subject *" {...register('subject')} error={errors.subject?.message} />

              <Textarea
                label="Message *"
                rows={5}
                placeholder="What are you trying to grow?"
                {...register('message')}
                error={errors.message?.message}
              />

              {/* Services multi-select as chips */}
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
                        className={`px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors ${
                          active ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                        }`}
                      >
                        <span className="mr-1.5">{s.icon}</span>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Select
                  label="Estimated budget"
                  {...register('budget')}
                  error={errors.budget?.message}
                  options={[{ value: '', label: 'Select…' }, ...BUDGET_OPTIONS]}
                />
                <Select
                  label="Timeline"
                  {...register('timeline')}
                  error={errors.timeline?.message}
                  options={[{ value: '', label: 'Select…' }, ...TIMELINE_OPTIONS]}
                />
              </div>

              <Input
                label="How did you hear about us?"
                placeholder="Search, referral, LinkedIn, etc."
                {...register('howHeardAboutUs')}
                error={errors.howHeardAboutUs?.message}
              />

              <Checkbox
                label={
                  <>
                    I agree to MetlifeDM&apos;s{' '}
                    <a href="/privacy" className="link-underline text-ink">privacy policy</a> and consent to being contacted about my inquiry.
                  </>
                }
                {...register('agreeTerms')}
                error={errors.agreeTerms?.message}
              />

              <div className="pt-4">
                <Button type="submit" size="lg" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Sending…' : 'Send message'}
                  <ArrowUpRight size={16} strokeWidth={1.5} />
                </Button>
              </div>
            </motion.form>
          </div>
        </Container>
      </Section>
    </>
  );
}
