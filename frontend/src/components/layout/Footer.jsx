import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowUpRight, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { NAV_FOOTER, SITE } from '@/utils/constants.js';
import Button from '@/components/ui/Button.jsx';
import { Container } from '@/components/ui/Layout.jsx';
import { useDispatch } from 'react-redux';
import { openCookieSettings } from '@/store/index.js';
import { usePublicSettings } from '@/providers/PublicSettingsProvider.jsx';

const Socials = ({ social }) => (
  <div className="flex gap-3 text-ivory/60">
    {[
      { Icon: Twitter, href: social.twitter, label: 'Twitter' },
      { Icon: Linkedin, href: social.linkedin, label: 'LinkedIn' },
      { Icon: Instagram, href: social.instagram, label: 'Instagram' },
      { Icon: Facebook, href: social.facebook, label: 'Facebook' },
    ].filter(({ href }) => href).map(({ Icon, href, label }) => (
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
  const dispatch = useDispatch();
  const settings = usePublicSettings();
  const footerColumns = settings.footer.columns.length ? settings.footer.columns : NAV_FOOTER;
  const primaryAddress = settings.contact.addresses.find((address) => address.isPrimary) || settings.contact.addresses[0];
  const locationLabel = [primaryAddress?.city, primaryAddress?.state].filter(Boolean).join(', ');
  const currentYear = new Date().getFullYear();
  const copyright = settings.footer.copyright
    ? settings.footer.copyright.replace(/\b20\d{2}\b/, String(currentYear))
    : `© ${currentYear} ${settings.business.registeredName}. All rights reserved.`;
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
      {settings.features.newsletterEnabled && <div className="border-b border-ivory/10">
        <Container className="py-16 md:py-24 grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <div className="text-eyebrow text-ivory/50 mb-4">01 / Newsletter</div>
            <h2 className="text-display-lg text-ivory">
              {settings.footer.newsletterTitle},<br />
              <span className="text-italic-fraunces text-ultra-soft">{settings.footer.newsletterSubtitle}</span>
            </h2>
          </div>
          <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                aria-label="Full name for newsletter"
                type="text"
                placeholder="Full name"
                {...register('name', { required: true, minLength: 2 })}
                className="flex-1 bg-transparent border-b border-ivory/25 pb-3 text-lg placeholder:text-ivory/30 focus:border-ultra-soft focus:outline-none"
              />
              <input
                aria-label="Email address for newsletter"
                type="email"
                placeholder="you@company.com"
                {...register('email', { required: true, pattern: /^\S+@\S+\.\S+$/ })}
                className="flex-1 bg-transparent border-b border-ivory/25 pb-3 text-lg placeholder:text-ivory/30 focus:border-ultra-soft focus:outline-none"
              />
            </div>
            {(errors.name || errors.email) && (
              <p className="text-mono text-xs text-ultra-soft">Enter your full name and a valid email.</p>
            )}
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
      </div>}

      {/* Link columns */}
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={settings.site.logo} alt="" className="h-11 w-auto" />
              <div className="text-display-md text-ivory">
                {settings.site.name}
                <span className="text-ultra-soft">.</span>
              </div>
            </div>
            <p className="text-ivory/60 text-sm max-w-sm mb-8 leading-relaxed">
              {settings.footer.about}
            </p>
            <Socials social={settings.social} />
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <div className="text-eyebrow text-ivory/50 mb-5">{col.title}</div>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith('/') ? (
                      <Link to={l.href} className="text-sm text-ivory/70 hover:text-ivory link-underline">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-ivory/70 hover:text-ivory link-underline">
                        {l.label}
                      </a>
                    )}
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
          <span>{copyright}</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {locationLabel && <span>Based in {locationLabel} · Working with clients across the US</span>}
            <button type="button" onClick={() => dispatch(openCookieSettings())} className="link-underline text-ivory/70 hover:text-ivory">
              Cookie settings
            </button>
          </span>
        </Container>
      </div>
    </footer>
  );
}
