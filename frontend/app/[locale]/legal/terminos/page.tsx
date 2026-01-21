'use client';

import { useTranslations } from 'next-intl';

export default function TerminosPage() {
    const t = useTranslations('legal.terms');

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="prose prose-lg max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

                <p className="lead">
                    {t('intro')}
                </p>

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
            </div>
        </div>
    );
}
