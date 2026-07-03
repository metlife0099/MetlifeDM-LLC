import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { contentApi } from '@/api/index.js';
import { SITE } from '@/utils/constants.js';
import { formatDate } from '@/utils/format.js';

/**
 * Renders a legal page (privacy/terms/cookies) driven by slug.
 * Fetches CMS content from backend, falls back to defaults below if none.
 */
const FALLBACKS = {
  privacy: {
    title: 'Privacy Policy',
    intro: `${SITE.name} respects your privacy. This policy explains what we collect, why, and how you control it.`,
    sections: [
      { heading: 'What we collect', body: 'Contact details (name, email, company, phone) when you fill out a form or create an account; usage data (pages visited, clicks) via analytics; payment details are handled by Stripe — we never store card numbers.' },
      { heading: 'How we use it', body: 'To respond to your inquiries, deliver services, send transactional emails, and — if you opt in — send our newsletter. We never sell or rent your data.' },
      { heading: 'Data retention', body: 'Account data is kept for the life of your account plus 24 months. Marketing data ceases when you unsubscribe. Financial records are retained for 7 years to comply with US tax law.' },
      { heading: 'Your rights', body: 'You can request access, correction, export, or deletion of your data at any time by emailing privacy@metlifedm.com. We respond within 30 days.' },
      { heading: 'Third parties', body: 'We use Stripe (payments), Cloudinary (image hosting), Brevo (email), and standard analytics tools. Each has its own privacy policy which we vet annually.' },
      { heading: 'Contact', body: 'Email privacy@metlifedm.com for any privacy-related question.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: `These terms govern your use of ${SITE.name}. By accessing our site or hiring us, you agree to them.`,
    sections: [
      { heading: 'Services', body: 'We provide digital marketing services described on our website. Specific engagements are governed by a signed statement of work (SOW) that overrides anything conflicting in these terms.' },
      { heading: 'Payments', body: 'Fees are due per the SOW. Monthly retainers renew automatically unless cancelled with 30 days notice. Late payments accrue 1.5% monthly interest.' },
      { heading: 'Intellectual property', body: 'You own the final deliverables once paid in full. We retain rights to underlying methodologies, templates, and know-how developed independently.' },
      { heading: 'Confidentiality', body: 'We treat all client information as confidential and do not disclose it without written permission (case-study feature-requests always require your sign-off).' },
      { heading: 'Warranty & liability', body: 'We warrant that we will perform services professionally. Our total liability is limited to fees paid in the 12 months preceding the claim. We are not liable for indirect or consequential damages.' },
      { heading: 'Termination', body: 'Either party may terminate for material breach with 30 days written notice and opportunity to cure. Fees for work performed through the termination date remain due.' },
      { heading: 'Governing law', body: 'These terms are governed by the laws of the State of New York. Any dispute is resolved in New York County courts.' },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    intro: `We use cookies to keep ${SITE.name} working properly and to understand how visitors interact with our site.`,
    sections: [
      { heading: 'What are cookies', body: 'Cookies are small text files stored in your browser. They let sites remember your preferences and measure how they are used.' },
      { heading: 'Types we use', body: 'Essential cookies (session, security — cannot be disabled). Analytics cookies (measure traffic — opt-in). Preference cookies (remember your settings, e.g. dismissed banners).' },
      { heading: 'Third-party cookies', body: 'Some third-party services (Stripe for payments, embedded video players) set their own cookies when you interact with them.' },
      { heading: 'Managing cookies', body: 'You can accept or reject non-essential cookies via our banner. You can also clear cookies at any time in your browser settings. Note: disabling essential cookies will break login and checkout.' },
      { heading: 'Changes', body: 'We update this policy from time to time. The effective date at the top reflects the latest revision.' },
    ],
  },
};

export default function LegalPage({ slug: slugProp }) {
  const location = useLocation();
  const slug = slugProp || location.pathname.replace('/', '') || 'privacy';

  const { data, isLoading } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => contentApi.getPageBySlug(slug).catch(() => null),
    retry: false,
  });

  const page = data?.page;
  const fallback = FALLBACKS[slug];
  const title = page?.title || fallback?.title || 'Legal';
  const intro = page?.excerpt || fallback?.intro || '';
  const sections = page?.sections || fallback?.sections || [];
  const updatedAt = page?.updatedAt || page?.lastUpdated;

  return (
    <>
      <Seo title={title} description={intro} />

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container className="max-w-4xl">
          <Eyebrow number="00">Legal / {title}</Eyebrow>
          <h1 className="text-display-hero mt-8">
            {title.split(' ')[0]}<br />
            <span className="text-italic-fraunces text-ultra">
              {title.split(' ').slice(1).join(' ') || 'policy.'}
            </span>
          </h1>
          {intro && <p className="text-slate text-lg mt-8 max-w-2xl leading-relaxed">{intro}</p>}
          <div className="mt-10 text-mono text-xs uppercase tracking-widest text-slate">
            Effective: {updatedAt ? formatDate(updatedAt, 'long') : formatDate(new Date(), 'long')}
          </div>
        </Container>
      </Section>

      <Section tone="ivory" spacing="lg">
        <Container className="max-w-4xl">
          {isLoading ? (
            <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
          ) : page?.content ? (
            /* CMS-driven long-form content */
            <article
              className="text-ink"
              style={{ fontFamily: 'var(--font-body)', lineHeight: 1.75 }}
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          ) : (
            /* Structured sections (from CMS or fallback) */
            <div className="divide-editorial border-t border-hairline">
              {sections.map((s, i) => (
                <div key={i} className="py-10 grid gap-8 md:grid-cols-[auto_1fr]">
                  <div className="md:sticky md:top-32 md:self-start">
                    <div className="num-plate text-slate text-xs mb-3">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h2 className="text-display-sm max-w-xs">{s.heading}</h2>
                  </div>
                  <div className="text-slate leading-relaxed whitespace-pre-line max-w-2xl">
                    {s.body}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 pt-10 border-t border-hairline text-mono text-xs uppercase tracking-widest text-slate">
            Questions?{' '}
            <a href="mailto:legal@metlifedm.com" className="link-underline text-ink">
              legal@metlifedm.com
            </a>{' '}
            · Related:{' '}
            <Link to="/privacy" className="link-underline text-ink">Privacy</Link>{' · '}
            <Link to="/terms" className="link-underline text-ink">Terms</Link>{' · '}
            <Link to="/cookies" className="link-underline text-ink">Cookies</Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
