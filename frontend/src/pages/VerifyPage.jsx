import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Ban, RefreshCw, SearchX, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Card, Spinner, Badge, Input } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { verifyApi } from '@/api/index.js';
import { formatDate } from '@/utils/format.js';

const NAVY = '#0A2342';
const GOLD = '#D4AF37';

const STATUS_CONTENT = {
  valid: { tone: 'success', Icon: ShieldCheck, badge: 'Valid', title: 'This document is valid.', body: 'This certificate was issued by MetlifeDM LLC and has not been revoked, cancelled, or replaced.' },
  revoked: { tone: 'danger', Icon: Ban, badge: 'Revoked', title: 'This document has been revoked.', body: 'This certificate is no longer valid. Contact MetlifeDM LLC directly if you have questions about its status.' },
  cancelled: { tone: 'danger', Icon: Ban, badge: 'Cancelled', title: 'This document has been cancelled.', body: 'This certificate is no longer valid. Contact MetlifeDM LLC directly if you have questions about its status.' },
  replaced: { tone: 'warn', Icon: RefreshCw, badge: 'Replaced', title: 'This document has been replaced.', body: 'A newer version of this document has been issued. This version is no longer current.' },
  not_found: { tone: 'default', Icon: SearchX, badge: 'Not found', title: 'No matching document was found.', body: 'Double-check the document number or verification link and try again.' },
};

export default function VerifyPage() {
  const { token } = useParams();
  const [identifier, setIdentifier] = useState(token || '');
  const [submitted, setSubmitted] = useState(token || '');

  useEffect(() => {
    if (token) {
      setIdentifier(token);
      setSubmitted(token);
    }
  }, [token]);

  const { data: result, isLoading, isFetching } = useQuery({
    queryKey: ['verify', submitted],
    queryFn: () => verifyApi.checkDocument(submitted),
    enabled: Boolean(submitted),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmed = identifier.trim();
    if (trimmed) setSubmitted(trimmed);
  };

  const content = result ? STATUS_CONTENT[result.status] || STATUS_CONTENT.not_found : null;

  return (
    <>
      <Seo
        title="Verify a Document"
        description="Verify the authenticity of a MetlifeDM LLC certificate, letter, or official document using its document number or QR code."
        keywords="document verification, certificate verification, verify MetlifeDM certificate, authenticate document"
        noindex={Boolean(token)}
      />

      <Section tone="ink" spacing="lg" divider={false}>
        <Container className="max-w-2xl text-center">
          <Eyebrow number="00" light>Document Verification</Eyebrow>
          <h1 className="text-display-hero mt-8 text-ivory">
            Verify a <span className="text-italic-fraunces" style={{ color: GOLD }}>document.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 leading-relaxed">
            Enter the document number from a MetlifeDM certificate or letter, or scan its QR code, to confirm authenticity.
          </p>

          <form onSubmit={onSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 items-stretch max-w-lg mx-auto">
            <div className="flex-1 text-left">
              <Input
                label="Document number or verification code"
                placeholder="e.g. MLDM/EXP/2026/0001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="sm:mt-6" disabled={!identifier.trim() || isFetching}>
              {isFetching ? 'Verifying…' : 'Verify'}
            </Button>
          </form>
        </Container>
      </Section>

      {submitted && (
        <Section tone="ivory" spacing="lg" divider={false}>
          <Container className="max-w-2xl">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Spinner size={32} className="text-ultra" />
              </div>
            ) : content ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card padding={false} className="overflow-hidden border-2" style={{ borderColor: GOLD }}>
                  <div className="p-6 flex items-center justify-between" style={{ backgroundColor: NAVY }}>
                    <div className="flex items-center gap-3">
                      <ScanLine size={18} strokeWidth={1.5} style={{ color: GOLD }} />
                      <span className="text-mono text-xs uppercase tracking-widest text-ivory">MetlifeDM Verification</span>
                    </div>
                    <Badge tone={content.tone}>{content.badge}</Badge>
                  </div>

                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-full grid place-items-center shrink-0" style={{ backgroundColor: `${content.tone === 'success' ? '#0d9b6c' : content.tone === 'danger' ? '#dc2626' : content.tone === 'warn' ? '#d97706' : '#727d96'}1A` }}>
                        <content.Icon size={26} strokeWidth={1.5} className={content.tone === 'success' ? 'text-success' : content.tone === 'danger' ? 'text-danger' : content.tone === 'warn' ? 'text-warn' : 'text-slate'} />
                      </div>
                      <div>
                        <div className="text-display-sm">{content.title}</div>
                      </div>
                    </div>
                    <p className="text-slate text-sm leading-relaxed">{content.body}</p>

                    {result.status !== 'not_found' && (
                      <div className="mt-8 pt-6 border-t border-hairline space-y-3 text-sm">
                        {result.documentNumber && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate">Document number</span>
                            <span className="num-plate text-ink">{result.documentNumber}</span>
                          </div>
                        )}
                        {result.documentType && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate">Document type</span>
                            <span className="capitalize">{String(result.documentType).replace(/_/g, ' ')}</span>
                          </div>
                        )}
                        {result.recipientName && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate">Recipient</span>
                            <span>{result.recipientName}</span>
                          </div>
                        )}
                        {result.designation && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate">Designation</span>
                            <span>{result.designation}</span>
                          </div>
                        )}
                        {result.projectName && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate">Project</span>
                            <span>{result.projectName}</span>
                          </div>
                        )}
                        {result.issueDate && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate">Issue date</span>
                            <span>{formatDate(result.issueDate, 'long')}</span>
                          </div>
                        )}
                        {result.issuingOrganization && (
                          <div className="flex justify-between gap-4">
                            <span className="text-slate">Issuing organization</span>
                            <span>{result.issuingOrganization}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {result.verifiedAt && (
                      <div className="mt-6 text-mono text-xs text-slate">
                        Verified {formatDate(result.verifiedAt, 'datetime')}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ) : null}
          </Container>
        </Section>
      )}
    </>
  );
}
