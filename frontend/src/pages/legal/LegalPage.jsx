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
    intro: `${SITE.name} respects your privacy. This policy explains what we collect, why and how you control it.`,
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We collect information you provide, including your name, email address, phone number, company details, billing information and project requirements. We also collect technical information such as your IP address, browser type, device information, pages visited and website usage through cookies and analytics tools.'
      },
      {
        heading: 'How We Collect Information',
        body: 'Information is collected when you contact us, request a quote, complete forms, subscribe to newsletters, create an account, purchase services, communicate with our team, or interact with our website. We may also receive information from trusted third-party providers and public business sources.'
      },
      {
        heading: 'Business Information',
        body: 'To deliver our Services, we may collect website URLs, hosting details, domain information, social media accounts, advertising platform access, analytics data, branding assets, API credential and other business-related information that you voluntarily provide.'
      },
      {
        heading: 'Automatic Data Collection',
        body: 'We automatically collect technical and usage information such as IP address, browser type, operating system, device identifiers, referral URLs, session duration, clicks and website interactions to improve performance, security and user experience.'
      },
      {
        heading: 'Cookies & Tracking',
        body: 'We use cookies, pixels, analytics tools and similar technologies to remember your preferences, improve website functionality, measure performance, analyze visitor behavior and enhance our Services. You can manage cookie preferences through your browser settings.'
      },
      {
        heading: 'Third-Party Sources',
        body: 'We may receive information from trusted third-party providers, including payment processors, analytics platforms, advertising services, CRM systems, cloud providers and publicly available business directories, where permitted by law.'
      },
      {
        heading: 'Children’s Privacy',
        body: 'Our Services are intended for individuals aged 18 or older and are not directed toward children under 13. We do not knowingly collect personal information from children and any such information will be deleted if identified.'
      },
      {
        heading: 'How We Use Your Information',
        body: 'We use your information to provide our Services, respond to inquiries, prepare proposals, process payments, manage projects, communicate updates, improve our website, personalize your experience, prevent fraud and comply with legal obligations.'
      },
      {
        heading: 'Marketing Communications',
        body: 'With your consent where required, we may send newsletters, service updates, promotional offers and educational content. You can unsubscribe from marketing emails at any time, though important service-related communications will still be sent.'
      },
      {
        heading: 'Payments',
        body: 'Payments are securely processed through trusted third-party payment providers. MetlifeDM LLC does not store your complete credit card or banking information on its servers.'
      },
      {
        heading: 'Information Sharing',
        body: 'We do not sell or rent your personal information. We only share information with trusted service providers, business partners, or legal authorities when necessary to provide our Services, comply with the law, or protect our legal rights.'
      },
      {
        heading: 'Third-Party Services',
        body: 'Our Services may integrate with providers such as Stripe, PayPal, Google, Meta, AWS, Cloudinary, Brevo, OpenAI, GitHub, Render, Vercel and analytics platforms. Each provider operates under its own privacy policy.'
      },
      {
        heading: 'Freelancers & White-Label Partners',
        body: 'Where necessary, limited project information may be shared with approved freelancers, contractors, or white-label partners solely for delivering the agreed Services. All are expected to maintain strict confidentiality.'
      },
      {
        heading: 'Artificial Intelligence',
        body: 'Some Services may use AI technologies to assist with content creation, automation, analytics, or workflow optimization. Clients are responsible for reviewing AI-generated content before publishing or business use.'
      },
      {
        heading: 'Legal Compliance',
        body: 'We may use or disclose information when required by law, court order, legal process, fraud prevention, security investigations, or to protect the rights, property and safety of MetlifeDM LLC, our clients, or the public.'
      },
      {
        heading: 'Business Transfers',
        body: 'If MetlifeDM LLC is involved in a merger, acquisition, restructuring, or sale of assets, your information may be transferred as part of the transaction, subject to applicable privacy laws.'
      },
      {
        heading: 'Data Security',
        body: 'We implement commercially reasonable security measures, including encryption, secure hosting, access controls and monitoring, to protect your information. However, no online system can guarantee absolute security.'
      },
      {
        heading: 'Data Retention',
        body: 'We retain personal information only as long as necessary to provide our Services, comply with legal obligations, resolve disputes, enforce agreements and maintain required business and financial records.'
      },
      {
        heading: 'Your Privacy Rights',
        body: 'Depending on applicable laws, you may have the right to access, correct, update, delete, or obtain a copy of your personal information, as well as withdraw consent or object to certain processing activities.'
      },
      {
        heading: 'Access & Correction',
        body: 'You may request access to the personal information we hold about you and ask us to correct inaccurate or incomplete information, subject to identity verification and applicable legal requirements.'
      },
      {
        heading: 'Data Deletion',
        body: 'You may request deletion of your personal information. We may retain certain records where required to comply with legal obligations, resolve disputes, prevent fraud, or enforce our agreements.'
      },
      {
        heading: 'Data Portability',
        body: 'Where applicable, you may request a portable copy of your personal information in a commonly used electronic format, subject to applicable laws and technical feasibility.'
      },
      {
        heading: 'Marketing Preferences',
        body: 'You may unsubscribe from promotional emails at any time. Transactional, billing, security and project-related communications will continue as necessary to provide our Services.'
      },
      {
        heading: 'Cookie Preferences',
        body: 'You can manage or disable non-essential cookies through our cookie banner or your browser settings. Disabling certain cookies may affect website functionality and user experience.'
      },
      {
        heading: 'Privacy Requests',
        body: 'To exercise your privacy rights, contact us at metlifedm4u@gmail.com. We may verify your identity before processing requests and will respond within the timeframe required by applicable law.'
      },
      {
        heading: 'Authorized Representatives',
        body: 'Where permitted by law, you may authorize another person to submit privacy requests on your behalf. We may require proof of authorization before processing such requests.'
      },
      {
        heading: 'Third-Party Links',
        body: 'Our website may contain links to third-party websites and services. We are not responsible for their privacy practices, content, or security. Please review their privacy policies before sharing personal information.'
      },
      {
        heading: 'International Users',
        body: 'If you access our Services from outside the United States, you understand that your information may be transferred to and processed in the United States or other countries where our service providers operate.'
      },
      {
        heading: 'Privacy Complaints',
        body: 'If you believe your privacy rights have been violated or have concerns about how your information is handled, please contact us first. We will review your concerns and respond in good faith in accordance with applicable laws.'
      },
      {
        heading: 'Account Deletion',
        body: 'You may request the deletion of your account and associated personal information by contacting us. Certain information may be retained where required by law, for fraud prevention, dispute resolution, tax compliance, or enforcement of our legal agreements.'
      },
      {
        heading: 'Data Breach Response',
        body: 'If we become aware of a security incident affecting your personal information, we will investigate promptly, take reasonable steps to mitigate the impact and notify affected individuals or authorities where required by applicable law.'
      },
      {
        heading: 'Business Transfers',
        body: 'If MetlifeDM LLC is involved in a merger, acquisition, reorganization, financing, or sale of assets, your information may be transferred as part of that transaction, subject to applicable privacy laws.'
      },
      {
        heading: 'Policy Updates',
        body: 'We may update this Privacy Policy from time to time to reflect changes in our Services, legal obligations, or business practices. The revised version will be posted on our website with an updated effective date.'
      },
      {
        heading: 'International Transfers',
        body: 'Your information may be processed and stored in the United States or other countries where our trusted service providers operate. By using our Services, you consent to such transfers where permitted by law.'
      },
      {
        heading: 'Data Security',
        body: 'We maintain commercially reasonable administrative, technical and physical safeguards to protect your information. However, no internet transmission or electronic storage system can be guaranteed to be completely secure.'
      },
      {
        heading: 'Legal Disclosure',
        body: 'We may disclose personal information when required by law, court order, legal process, or when necessary to protect the rights, property, security, or safety of MetlifeDM LLC, our users, business partners, or the public.'
      },
      {
        heading: 'Children’s Privacy',
        body: 'Our Services are not intended for children under the age of 13. We do not knowingly collect personal information from children and any such information will be deleted promptly upon discovery.'
      },
      {
        heading: 'Contact Us',
        body: 'If you have questions, requests, or concerns regarding this Privacy Policy or your personal information, please contact us at metlifedm4u@gmail.com. We will respond within the timeframe required by applicable law.'
      },
      {
        heading: 'Effective Date',
        body: 'This Privacy Policy is effective as of August 8, 2026 and supersedes all previous versions. Continued use of our website or Services after updates constitutes acceptance of the revised Privacy Policy.'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    intro: `These terms govern your use of ${SITE.name}. By accessing our site or hiring us, you agree to them.`,
    sections: [
      {
        heading: 'Acceptance of Terms',
        body: 'By accessing our website or using any services provided by MetlifeDM LLC, you agree to be legally bound by these Terms and Conditions. If you do not agree, please discontinue use of our website and services immediately.'
      },
      {
        heading: 'Eligibility',
        body: 'Our services are available only to individuals and organizations legally capable of entering into binding contracts. By using our services, you represent that you have the authority to enter into this agreement on behalf of yourself or your organization.'
      },
      {
        heading: 'Definitions',
        body: 'References to "MetlifeDM LLC," "Company," "we," and "our" mean MetlifeDM LLC. "Client," "User," and "you" refer to any individual, business, corporation, agency, freelancer, contractor, or white-label partner using our website or services.'
      },
      {
        heading: 'Scope of Services',
        body: 'MetlifeDM LLC provides digital marketing, web development, branding, SEO, paid advertising, software development, consulting, AI solutions and related digital services. The exact scope of each project is governed by an approved Proposal, Statement of Work (SOW), or Service Agreement.'
      },
      {
        heading: 'No Guarantee of Results',
        body: 'While we apply industry best practices and professional expertise, we do not guarantee specific rankings, sales, leads, revenue, website traffic, advertising approvals, or business outcomes, as results depend on numerous factors beyond our control.'
      },
      {
        heading: 'Client Responsibilities',
        body: 'Clients must provide accurate information, timely approvals, required access credentials and lawful content. Delays or failures to provide required information may impact project timelines and service delivery.'
      },
      {
        heading: 'Changes to Terms',
        body: 'MetlifeDM LLC reserves the right to update these Terms at any time. Continued use of our website or services after changes become effective constitutes acceptance of the revised Terms.'
      },
      {
        heading: 'Service Agreements',
        body: 'All projects are governed by an approved Proposal, Statement of Work (SOW), Service Agreement, or written quotation. In the event of a conflict, the signed project agreement will prevail over these Terms for that specific engagement.'
      },
      {
        heading: 'Project Timelines',
        body: 'Project timelines are estimates and depend on timely client cooperation. Delays caused by missing content, approvals, access credentials, or third-party providers may extend delivery schedules without liability to MetlifeDM LLC.'
      },
      {
        heading: 'Change Requests',
        body: 'Any work requested outside the agreed project scope is considered a Change Request and may require additional fees, revised timelines, or a separate written agreement before work begins.'
      },
      {
        heading: 'Payments',
        body: 'Invoices are payable according to the applicable Proposal or SOW. Unless otherwise agreed, recurring services are billed in advance and project work may require milestone or upfront payments before commencement.'
      },
      {
        heading: 'Late Payments',
        body: 'Late payments may incur interest of up to 1.5% per month or the maximum amount permitted by Delaware law, whichever is lower. We reserve the right to suspend services until all outstanding balances are paid.'
      },
      {
        heading: 'Subscriptions & Retainers',
        body: 'Monthly retainers and subscription services renew automatically unless cancelled with at least thirty (30) days’ written notice prior to the next billing cycle, unless otherwise stated in the applicable agreement.'
      },
      {
        heading: 'Refund Policy',
        body: 'Unless expressly stated in a written agreement, all payments are non-refundable once work has commenced. Refunds do not apply to completed work, advertising spend, third-party costs, software licenses, domains, hosting, or customized deliverables.'
      },
      {
        heading: 'Chargebacks',
        body: 'Clients agree to contact MetlifeDM LLC before initiating any chargeback or payment dispute. Fraudulent or unjustified chargebacks may result in immediate suspension of services and recovery of outstanding amounts, collection costs and legal fees where permitted by law.'
      },
      {
        heading: 'Suspension of Services',
        body: 'MetlifeDM LLC may suspend or terminate services for non-payment, breach of these Terms, unlawful activities, abusive conduct, or any action that creates legal, operational, or reputational risk to the Company.'
      },
      {
        heading: 'Taxes & Currency',
        body: 'Unless otherwise stated, all fees are quoted in U.S. Dollars (USD) and exclude applicable taxes. Clients are responsible for all taxes, currency conversion fees, banking charges and international transaction costs associated with payments.'
      },
      {
        heading: 'Intellectual Property',
        body: 'All pre-existing intellectual property, methodologies, templates, frameworks, software, strategies and proprietary materials developed or owned by MetlifeDM LLC remain our exclusive property. Ownership of final deliverables transfers to the Client only after full payment, unless otherwise agreed in writing.'
      },
      {
        heading: 'Client Content',
        body: 'You retain ownership of the content, trademarks, logos, images and materials you provide. By submitting such content, you grant MetlifeDM LLC a non-exclusive license to use, modify and display it solely for the purpose of providing the agreed Services.'
      },
      {
        heading: 'Third-Party Services',
        body: 'Our Services may rely on third-party platforms such as Google, Meta, AWS, Stripe, OpenAI, Cloudflare and other providers. We are not responsible for their availability, pricing, policy changes, outages, or performance.'
      },
      {
        heading: 'Open-Source Software',
        body: 'Any open-source software included in your project remains subject to its respective license terms. MetlifeDM LLC does not claim ownership of open-source components or guarantee their future availability or support.'
      },
      {
        heading: 'White-Label Partnerships',
        body: 'White-label partners remain solely responsible for their client relationships, pricing, contracts and legal compliance. MetlifeDM LLC acts only as an independent service provider unless otherwise agreed in writing.'
      },
      {
        heading: 'Freelancers & Contractors',
        body: 'MetlifeDM LLC may engage qualified freelancers, contractors, or subcontractors to assist in delivering Services. All such individuals operate as independent contractors and not as employees, agents, or partners of the Client.'
      },
      {
        heading: 'Portfolio Rights',
        body: 'Unless restricted by a written confidentiality agreement, MetlifeDM LLC may showcase completed work, publicly available websites, logos and project summaries in its portfolio, marketing materials and case studies. Confidential information will never be disclosed without your written consent.'
      },
      {
        heading: 'Confidentiality',
        body: 'Both parties agree to protect confidential information received during the engagement and not disclose it to third parties except as required by law or necessary to perform the Services.'
      },
      {
        heading: 'Non-Solicitation',
        body: 'During the engagement and for twelve (12) months thereafter, Clients agree not to knowingly hire or solicit MetlifeDM LLC employees, contractors, or consultants who were directly involved in the project without prior written consent.'
      },
      {
        heading: 'Non-Circumvention',
        body: 'Clients shall not intentionally bypass MetlifeDM LLC by directly engaging our employees, contractors, freelancers, vendors, or partners introduced through the project for substantially similar services without our written approval.'
      },
      {
        heading: 'Feedback',
        body: 'Any suggestions, comments, or feedback voluntarily provided regarding our Services may be used by MetlifeDM LLC without restriction or obligation to compensate the Client.'
      },
      {
        heading: 'Privacy & Data Protection',
        body: 'We process personal and business information in accordance with our Privacy Policy and implement commercially reasonable security measures. However, no online system is completely secure and we cannot guarantee absolute security against unauthorized access or cyber threats.'
      },
      {
        heading: 'Client Data Responsibility',
        body: 'You represent that you have the legal right to collect, process and share any personal or business information provided to us. You remain solely responsible for complying with all applicable privacy and data protection laws governing your business.'
      },
      {
        heading: 'Acceptable Use',
        body: 'You agree not to use our website or Services for unlawful, fraudulent, abusive, defamatory, infringing, or malicious activities, including the distribution of malware, unauthorized access attempts, or violations of applicable laws or third-party rights.'
      },
      {
        heading: 'Compliance',
        body: 'You are solely responsible for ensuring that your business, products, services, advertisements and content comply with all applicable local, state, federal and international laws and regulations.'
      },
      {
        heading: 'Warranty Disclaimer',
        body: 'Except as expressly stated in a written Service Agreement, all Services are provided "as is" and "as available" without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.'
      },
      {
        heading: 'Limitation of Liability',
        body: 'To the fullest extent permitted by law, MetlifeDM LLC shall not be liable for any indirect, incidental, consequential, special, or punitive damages. Our total liability for any claim shall not exceed the total fees paid by the Client for the applicable Services during the twelve (12) months preceding the claim.'
      },
      {
        heading: 'Indemnification',
        body: 'You agree to defend, indemnify and hold harmless MetlifeDM LLC, its owners, employees, contractors, affiliates and partners from any claims, damages, liabilities, costs, or legal expenses arising from your use of our Services, your content, your business activities, or your violation of these Terms.'
      },
      {
        heading: 'Force Majeure',
        body: 'MetlifeDM LLC shall not be liable for delays or failures caused by events beyond our reasonable control, including natural disasters, internet outages, cyberattacks, government actions, labor disputes, pandemics, hosting failures, or third-party service interruptions.'
      },
      {
        heading: 'Termination',
        body: 'Either party may terminate Services in accordance with the applicable Service Agreement. MetlifeDM LLC may immediately suspend or terminate Services for non-payment, material breach, fraudulent activity, abuse, or unlawful conduct. Outstanding fees remain payable through the effective termination date.'
      },
      {
        heading: 'Dispute Resolution',
        body: 'The parties agree to first attempt to resolve disputes through good-faith negotiation. If a resolution cannot be reached, disputes shall be resolved exclusively in the state or federal courts located in the State of Delaware, unless otherwise required by applicable law.'
      },
      {
        heading: 'Governing Law',
        body: 'These Terms and any related agreements shall be governed by and interpreted in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles.'
      },
      {
        heading: 'Severability',
        body: 'If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.'
      },
      {
        heading: 'Entire Agreement',
        body: 'These Terms, together with our Privacy Policy, applicable Service Agreement, Proposal, or Statement of Work (SOW), constitute the complete agreement between you and MetlifeDM LLC and supersede all prior discussions or understandings.'
      },
      {
        heading: 'Changes to Terms',
        body: 'We may update these Terms from time to time. Continued use of our website or Services after revised Terms become effective constitutes your acceptance of the updated Terms.'
      }
    ]
  },
  cookies: {
    title: 'Cookie Policy',
    intro: `We use cookies to keep ${SITE.name} working properly and to understand how visitors interact with our site.`,
    sections: [
      {
        heading: 'What Are Cookies',
        body: 'Cookies are small text files stored on your device when you visit our website. They help remember your preferences, improve website functionality, enhance security and provide a better browsing experience.'
      },
      {
        heading: 'Why We Use Cookies',
        body: 'MetlifeDM LLC uses cookies to operate our website, remember your settings, analyze visitor behavior, improve website performance, personalize your experience and support our digital marketing and business operations.'
      },
      {
        heading: 'Essential Cookies',
        body: 'Essential cookies are required for core website functionality, including page navigation, account login, security, form submissions and session management. These cookies cannot be disabled without affecting the operation of our website.'
      },
      {
        heading: 'Performance & Analytics Cookies',
        body: 'Analytics cookies help us understand how visitors interact with our website by collecting information such as pages visited, traffic sources, session duration and user interactions. This information helps us improve our website and Services.'
      },
      {
        heading: 'Preference Cookies',
        body: 'Preference cookies remember your choices, such as language, region, cookie preferences and other personalized settings, providing a more convenient browsing experience during future visits.'
      },
      {
        heading: 'Marketing Cookies',
        body: 'Marketing cookies may be used to measure advertising performance, understand campaign effectiveness and display more relevant advertisements across websites and digital platforms, where permitted by applicable law.'
      },
      {
        heading: 'Session & Persistent Cookies',
        body: 'Session cookies are automatically removed when you close your browser, while persistent cookies remain on your device for a specified period to remember your preferences and improve future visits.'
      },
      {
        heading: 'Third-Party Cookies',
        body: 'Some cookies are placed by trusted third-party providers such as Google Analytics, Google Ads, Stripe, Cloudinary, Brevo, Meta, YouTube and other integrated services. These providers operate under their own privacy and cookie policies.'
      },
      {
        heading: 'Service Providers',
        body: 'We work with carefully selected service providers for analytics, payments, hosting, email delivery, security and marketing. These providers may use cookies or similar technologies solely to support the Services they provide to MetlifeDM LLC.'
      },
      {
        heading: 'Managing Cookies',
        body: 'You can manage or delete cookies at any time through your browser settings. Most browsers allow you to block, delete, or restrict cookies; however, doing so may affect certain features and functionality of our website.'
      },
      {
        heading: 'Cookie Consent',
        body: 'Where required by applicable law, we request your consent before placing non-essential cookies on your device. You can update your cookie preferences at any time through our cookie banner or browser settings.'
      },
      {
        heading: 'Disabling Cookies',
        body: 'Disabling essential cookies may prevent certain website features from working properly, including secure login, contact forms, account management and other core functionality.'
      },
      {
        heading: 'Cookie Retention',
        body: 'Cookies remain on your device only for the period necessary to fulfill their intended purpose. Session cookies expire when your browser closes, while persistent cookies remain until they expire or are manually deleted.'
      },
      {
        heading: 'Policy Updates',
        body: 'We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or our business practices. The latest version will always be available on our website with an updated effective date.'
      },
      {
        heading: 'Contact Us',
        body: 'If you have any questions about our use of cookies or this Cookie Policy, please contact MetlifeDM LLC at metlifedm4u@gmail.com. We will be happy to assist you with any privacy or cookie-related inquiries.'
      }
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
            <a href="mailto:metlifedm4u@gmail.com" className="link-underline text-ink">
              metlifedm4u@gmail.com
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
