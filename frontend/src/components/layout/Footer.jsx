import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowUpRight, Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { NAV_FOOTER, SITE } from '@/utils/constants.js';
import Button from '@/components/ui/Button.jsx';
import { Container } from '@/components/ui/Layout.jsx';

const Socials = () => (
  <div className="flex gap-3 text-ivory/60">
    {[
      { Icon: Twitter, href: 'https://twitter.com/metlifedm', label: 'Twitter' },
      { Icon: Linkedin, href: 'https://linkedin.com/company/metlifedm', label: 'LinkedIn' },
      { Icon: Instagram, href: 'https://instagram.com/metlifedm', label: 'Instagram' },
      { Icon: Facebook, href: 'https://facebook.com/metlifedm', label: 'Facebook' },
      { Icon: Youtube, href: 'https://youtube.com/@metlifedm', label: 'YouTube' },
    ].map(({ Icon, href, label }) => (
      <a
        key={label}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="w-10 h-10 grid place-items-center border border-ivory/15 hover:border-ivory hover:text-ivory transition-colors"
      >
        <Icon size={16} strokeWidth={1.25} />
      </a>
    ))}
  </div>
);

export default function Footer() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const mutation = useMutation({
    mutationFn: leadsApi.subscribeNewsletter,
    onSuccess: () => {
      toast.success('Subscribed. Watch your inbox.');
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <footer className="bg-ink text-ivory">
      {/* Newsletter band */}
      <div className="border-b border-ivory/10">
        <Container className="py-16 md:py-24 grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <div className="text-eyebrow text-ivory/50 mb-4">01 / Newsletter</div>
            <h2 className="text-display-lg text-ivory">
              Growth playbooks,<br />
              <span className="text-italic-fraunces text-ultra-soft">every Tuesday.</span>
            </h2>
          </div>
          <form onSubmit={handleSubmit(mutation.mutate)} className="flex gap-3">
            <input
              type="email"
              placeholder="you@company.com"
              {...register('email', { required: true, pattern: /^\S+@\S+\.\S+$/ })}
              className="flex-1 bg-transparent border-b border-ivory/25 pb-3 text-lg placeholder:text-ivory/30 focus:border-ultra-soft focus:outline-none"
            />
            <Button
              type="submit"
              variant="inverse"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Subscribing…' : 'Subscribe'}
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </Button>
          </form>
        </Container>
      </div>

      {/* Link columns */}
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="text-display-md text-ivory mb-4">
              {SITE.name}
              <span className="text-ultra-soft">.</span>
            </div>
            <p className="text-ivory/60 text-sm max-w-sm mb-8 leading-relaxed">
              A US-based digital marketing agency helping 200+ businesses grow through SEO, PPC, content, and AI-powered marketing.
            </p>
            <Socials />
          </div>
          {NAV_FOOTER.map((col) => (
            <div key={col.title}>
              <div className="text-eyebrow text-ivory/50 mb-5">{col.title}</div>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="text-sm text-ivory/70 hover:text-ivory link-underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-ivory/10">
        <Container className="py-6 flex flex-col md:flex-row gap-4 justify-between text-mono text-xs text-ivory/40">
          <span>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</span>
          <span>Based in {SITE.city} · Serving all 50 states</span>
        </Container>
      </div>
    </footer>
  );
}
