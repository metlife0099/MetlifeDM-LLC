import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  Upload,
  Trash2,
  Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner, Badge, Input, Textarea, Checkbox } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { formatMoney } from '@/utils/format.js';

const applicationSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  linkedIn: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  portfolio: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  coverLetter: z.string().min(50, 'Tell us more'),
  yearsExperience: z.string().optional(),
  currentCompany: z.string().optional(),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms' }) }),
});

export default function CareerDetailsPage() {
  const { slug } = useParams();
  const [resumeFile, setResumeFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['career', slug],
    queryFn: () => leadsApi.getCareer(slug),
    enabled: !!slug,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(applicationSchema) });

  const apply = useMutation({
    mutationFn: (payload) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== '') fd.append(k, v);
      });
      if (resumeFile) fd.append('resume', resumeFile);
      return leadsApi.applyToJob(data.job._id, fd);
    },
    onSuccess: () => {
      toast.success('Application received. We&apos;ll review within 5 business days.');
      setSubmitted(true);
      reset();
      setResumeFile(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) {
    return <div className="grid place-items-center min-h-[60vh]"><Spinner size={32} className="text-ultra" /></div>;
  }
  if (error || !data?.job) {
    return (
      <Section spacing="xl">
        <Container>
          <Eyebrow>404 / Not found</Eyebrow>
          <h1 className="text-display-lg mt-4">Role not found</h1>
          <Link to="/careers" className="mt-8 inline-block link-underline text-ink">← All roles</Link>
        </Container>
      </Section>
    );
  }

  const job = data.job;
  const salary = job.salary || {};

  const onSubmit = (formData) => {
    if (!resumeFile) {
      toast.error('Please attach your resume');
      return;
    }
    // eslint-disable-next-line no-unused-vars
    const { agreeTerms, ...payload } = formData;
    apply.mutate(payload);
  };

  return (
    <>
      <Seo title={job.title} description={job.shortDescription} />

      {/* Hero */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Link to="/careers" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
            ← All roles
          </Link>
          <div className="mt-8 flex items-center gap-3 flex-wrap">
            <Badge>{job.department}</Badge>
            <Badge tone="outline">{job.employmentType?.replace('_', ' ') || 'Full-time'}</Badge>
            <Badge tone="ultra">{job.location || 'Remote'}</Badge>
          </div>
          <h1 className="text-display-hero mt-8 max-w-4xl">{job.title}</h1>
          {job.shortDescription && (
            <p className="text-slate text-lg mt-8 max-w-2xl leading-relaxed">{job.shortDescription}</p>
          )}

          {/* Meta */}
          <div className="mt-10 grid gap-6 md:grid-cols-3 md:max-w-2xl">
            <div className="border-l border-ultra pl-4">
              <div className="text-mono text-xs uppercase tracking-widest text-slate mb-1 flex items-center gap-1">
                <MapPin size={12} strokeWidth={1.5} /> Location
              </div>
              <div className="text-sm">{job.location || 'Remote (US)'}</div>
            </div>
            <div className="border-l border-ultra pl-4">
              <div className="text-mono text-xs uppercase tracking-widest text-slate mb-1 flex items-center gap-1">
                <Clock size={12} strokeWidth={1.5} /> Type
              </div>
              <div className="text-sm">{job.employmentType?.replace('_', ' ') || 'Full-time'}</div>
            </div>
            {(salary.min || salary.max) && (
              <div className="border-l border-ultra pl-4">
                <div className="text-mono text-xs uppercase tracking-widest text-slate mb-1 flex items-center gap-1">
                  <DollarSign size={12} strokeWidth={1.5} /> Salary
                </div>
                <div className="text-sm num-plate">
                  {salary.min ? formatMoney(salary.min) : ''}
                  {salary.min && salary.max ? ' – ' : ''}
                  {salary.max ? formatMoney(salary.max) : ''}
                </div>
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* Body */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
            {/* Left: description */}
            <div className="space-y-14 max-w-2xl">
              {job.description && (
                <div>
                  <Eyebrow number="01">About the role</Eyebrow>
                  <div
                    className="mt-6 text-slate text-lg leading-relaxed whitespace-pre-line"
                  >
                    {job.description}
                  </div>
                </div>
              )}
              {job.responsibilities?.length > 0 && (
                <div>
                  <Eyebrow number="02">What you&apos;ll do</Eyebrow>
                  <ul className="mt-6 space-y-4">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="num-plate text-slate text-xs shrink-0 mt-1.5">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-slate leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {job.requirements?.length > 0 && (
                <div>
                  <Eyebrow number="03">Requirements</Eyebrow>
                  <ul className="mt-6 space-y-3">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="flex gap-3 items-start text-slate">
                        <CheckCircle2 size={16} strokeWidth={1.5} className="text-ultra mt-1 shrink-0" />
                        <span className="leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {job.benefits?.length > 0 && (
                <div>
                  <Eyebrow number="04">Benefits</Eyebrow>
                  <ul className="mt-6 grid gap-3 md:grid-cols-2">
                    {job.benefits.map((b, i) => (
                      <li key={i} className="flex gap-3 items-start text-slate">
                        <CheckCircle2 size={16} strokeWidth={1.5} className="text-ultra mt-1 shrink-0" />
                        <span className="leading-relaxed text-sm">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: application form (sticky) */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-success/30 bg-success/5 p-10 text-center"
                >
                  <div className="w-16 h-16 grid place-items-center bg-success/10 rounded-full mx-auto mb-6">
                    <CheckCircle2 size={28} strokeWidth={1.5} className="text-success" />
                  </div>
                  <div className="text-display-sm mb-3">Application received.</div>
                  <p className="text-slate text-sm leading-relaxed">
                    We review every submission ourselves. Expect to hear back within 5 business days — one way or the other.
                  </p>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="border border-hairline p-8 space-y-6 bg-ivory-soft"
                >
                  <div>
                    <Eyebrow>Apply</Eyebrow>
                    <h3 className="text-display-sm mt-2">
                      Send an <span className="text-italic-fraunces text-ultra">intro.</span>
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="First name *" {...register('firstName')} error={errors.firstName?.message} />
                    <Input label="Last name *" {...register('lastName')} error={errors.lastName?.message} />
                  </div>
                  <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
                  <Input label="Phone" type="tel" {...register('phone')} />
                  <Input label="Years experience" {...register('yearsExperience')} placeholder="e.g. 5" />
                  <Input label="Current company" {...register('currentCompany')} />
                  <Input label="LinkedIn" type="url" placeholder="https://linkedin.com/in/…" {...register('linkedIn')} error={errors.linkedIn?.message} />
                  <Input label="Portfolio / website" type="url" placeholder="https://" {...register('portfolio')} error={errors.portfolio?.message} />

                  {/* Resume file upload */}
                  <div>
                    <div className="text-eyebrow mb-2">Resume *</div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      hidden
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                    {resumeFile ? (
                      <div className="flex items-center justify-between border border-hairline p-3">
                        <div className="text-sm truncate">
                          <div className="font-medium">{resumeFile.name}</div>
                          <div className="text-mono text-xs text-slate">
                            {(resumeFile.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setResumeFile(null)}
                          className="text-slate hover:text-danger p-1"
                          aria-label="Remove resume"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full border border-dashed border-hairline hover:border-ink p-6 flex flex-col items-center gap-2 transition-colors"
                      >
                        <Upload size={18} strokeWidth={1.25} className="text-slate" />
                        <span className="text-mono text-xs uppercase tracking-widest">Attach resume</span>
                        <span className="text-mono text-[0.65rem] text-slate">PDF, DOC — max 5 MB</span>
                      </button>
                    )}
                  </div>

                  <Textarea
                    label="Cover letter *"
                    rows={5}
                    placeholder="Why this role, why us — in your own words."
                    {...register('coverLetter')}
                    error={errors.coverLetter?.message}
                  />

                  <Checkbox
                    label={
                      <>
                        I agree to MetlifeDM&apos;s{' '}
                        <Link to="/privacy" className="link-underline text-ink">privacy policy</Link>.
                      </>
                    }
                    {...register('agreeTerms')}
                    error={errors.agreeTerms?.message}
                  />

                  <Button type="submit" size="lg" className="w-full" disabled={apply.isPending}>
                    {apply.isPending ? 'Submitting…' : 'Submit application'}
                    <ArrowUpRight size={16} strokeWidth={1.5} />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
