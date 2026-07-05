import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Check } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner, ServicesGrid } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';

export default function IndustryDetailsPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['industry', slug],
    queryFn: () => contentApi.getIndustryBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="grid place-items-center min-h-[60vh]"><Spinner size={32} className="text-ultra" /></div>;
  }
  if (error || !data?.industry) {
    return (
      <Section spacing="xl">
        <Container>
          <Eyebrow>404 / Not found</Eyebrow>
          <h1 className="text-display-lg mt-4">Industry not found</h1>
          <Link to="/industries" className="mt-8 inline-block link-underline text-ink">← All industries</Link>
        </Container>
      </Section>
    );
  }

  const ind = data.industry;
  const relatedCases = data.relatedCaseStudies || [];
  const recommendedServices = data.recommendedServices || [];

  return (
    <>
      <Seo title={ind.name} description={ind.shortDescription} />

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Link to="/industries" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
            ← All industries
          </Link>
          <div className="text-5xl mt-8">{ind.icon}</div>
          <Eyebrow number="00" className="mt-6">Industry / {ind.name}</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl">
            {ind.name}<br />
            <span className="text-italic-fraunces text-ultra">marketing.</span>
          </h1>
          {ind.description && (
            <div
              className="text-slate text-lg mt-8 max-w-2xl leading-relaxed prose"
              dangerouslySetInnerHTML={{ __html: ind.description }}
            />
          )}
        </Container>
      </Section>

      {/* Challenges */}
      {ind.challenges?.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
              <div>
                <Eyebrow number="01">Challenges</Eyebrow>
                <h2 className="text-display-lg mt-4">
                  What we hear<br />
                  <span className="text-italic-fraunces text-ultra">most often.</span>
                </h2>
              </div>
              <div className="divide-editorial border-t border-hairline">
                {ind.challenges.map((c, i) => (
                  <div key={i} className="py-6 grid grid-cols-[auto_1fr] gap-6">
                    <span className="num-plate text-slate text-sm w-10">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-display-sm mb-2">{c.title}</h3>
                      {c.description && (
                        <p className="text-slate leading-relaxed max-w-xl">{c.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Solutions / Approach */}
      {ind.solutions?.length > 0 && (
        <Section tone="ink" spacing="lg" divider={false}>
          <Container>
            <div className="text-eyebrow text-ivory/50 mb-4">02 / Our approach</div>
            <h2 className="text-display-lg text-ivory mb-14">
              How we <span className="text-italic-fraunces text-ultra-soft">solve them.</span>
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {ind.solutions.map((s, i) => (
                <div key={i} className="border border-ivory/15 p-8">
                  <div className="w-8 h-8 grid place-items-center bg-ultra rounded-full mb-6">
                    <Check size={16} strokeWidth={2} className="text-ivory" />
                  </div>
                  <h3 className="text-display-sm text-ivory mb-3">{s.title}</h3>
                  {s.description && (
                    <p className="text-ivory/70 leading-relaxed">{s.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Recommended services */}
      {recommendedServices.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
              <div>
                <Eyebrow number="03">Recommended services</Eyebrow>
                <h2 className="text-display-lg mt-4">
                  Where we start.
                </h2>
              </div>
              <Link to="/services" className="text-mono text-xs uppercase tracking-widest link-underline text-ink">
                All services →
              </Link>
            </div>
            <ServicesGrid services={recommendedServices} showAll={false} />
          </Container>
        </Section>
      )}

      {/* Related case studies */}
      {relatedCases.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
              <div>
                <Eyebrow number="04">Case studies</Eyebrow>
                <h2 className="text-display-lg mt-4">Related work.</h2>
              </div>
              <Link to="/case-studies" className="text-mono text-xs uppercase tracking-widest link-underline text-ink">
                All case studies →
              </Link>
            </div>
            <div className="divide-editorial border-t border-hairline">
              {relatedCases.map((c, i) => (
                <Link
                  key={c._id}
                  to={`/case-studies/${c.slug}`}
                  className="py-8 grid grid-cols-[auto_1fr_auto] gap-6 items-center group"
                >
                  <span className="num-plate text-slate text-sm">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-display-sm group-hover:text-ultra transition-colors">{c.title}</h3>
                    {c.summary && <p className="text-slate text-sm mt-2 max-w-xl">{c.summary}</p>}
                  </div>
                  <ArrowUpRight size={20} strokeWidth={1.25} className="group-hover:rotate-45 transition-transform duration-300" />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner
        title={<>Ready to grow your <span className="text-italic-fraunces text-ultra">{ind.name}</span> business?</>}
      />
    </>
  );
}
