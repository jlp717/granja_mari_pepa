'use client';

import { useTranslations } from 'next-intl';
import { SourceFooterBridge, SourceUtilityPage } from '@/components/pds/source-sections';

export default function PrivacidadPage() {
    const t = useTranslations('legal.privacy');

    return (
        <main className="pds-page pds-cream">
            <SourceUtilityPage eyebrow="Legal" title={t('title')} copy={t('intro')} tabletHeight={6651} mobileHeight={3244}>
                <div className="space-y-10 text-lg leading-snug text-[#0e1620]/80 [&_h3]:text-3xl [&_h3]:font-medium [&_h3]:tracking-[-0.03em]">
                    <h3>{t('sections.s1.title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('sections.s1.content') }} />

                    <h3>{t('sections.s2.title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('sections.s2.content') }} />

                    <h3>{t('sections.s3.title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('sections.s3.content') }} />

                    <h3>{t('sections.s4.title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('sections.s4.content') }} />

                    <h3>{t('sections.s5.title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('sections.s5.content') }} />

                    <h3>{t('sections.s6.title')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('sections.s6.content') }} />
                </div>
            </SourceUtilityPage>
            <SourceFooterBridge title={t('title')} copy={t('intro')} tabletHeight={1163} mobileHeight={568} />
        </main>
    );
}
