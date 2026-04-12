'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import * as z from 'zod'
import { ScrollScrubHero } from '@/components/pds/scroll-scrub-hero'
import {
  PDS_ASSETS,
  SourceFeatureMosaic,
  SourceStatsSection
} from '@/components/pds/joby-sections'

type ContactFormData = {
  nombre: string
  empresa: string
  email: string
  telefono: string
  mensaje: string
  privacidad: boolean
}

const EXPERIENCE_VIDEO =
  'https://pub-c3f399360b0b4437b233f8cc0505582a.r2.dev/videos/compressed-experience-desktop-r2.mp4'

export default function ContactPage() {
  const t = useTranslations('contact_page')
  const tHero = useTranslations('hero')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const contactFormSchema = z.object({
    nombre: z.string().min(2, t('form_section.errors.name')),
    empresa: z.string().min(2, t('form_section.errors.company')),
    email: z.string().email(t('form_section.errors.email')),
    telefono: z.string().min(9, t('form_section.errors.phone')),
    mensaje: z.string().min(10, t('form_section.errors.message')),
    privacidad: z.boolean().refine((val) => val === true, t('form_section.errors.privacy'))
  })

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      mensaje: '',
      privacidad: false
    }
  })

  const onSubmit = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    toast.success(t('form_section.success'))
    form.reset()
    setIsSubmitting(false)
  }

  return (
    <main className="pds-page">
      <ScrollScrubHero
        videoSrc={EXPERIENCE_VIDEO}
        scrollVh={1400}
        eyebrow={t('hero.badge')}
        title={t('hero.title')}
        subtitle={`${t('hero.subtitle_1')} ${t('hero.subtitle_highlight')} ${t('hero.subtitle_2')}`}
        description={t('hero.description')}
        actions={
          <a href="#contact-form" className="pds-button pds-button--dark">
            <Send className="h-5 w-5" />
            <span>{t('hero.cta_send')}</span>
          </a>
        }
      />

      <SourceFeatureMosaic
        eyebrow={t('channels.description')}
        title={
          <>
            <span className="block">{t('channels.title_1')}</span>
            <span className="block">{t('channels.title_2')}</span>
          </>
        }
        copy={t('hero.description')}
        features={[
          { title: t('channels.murcia.title'), copy: t('channels.murcia.desc'), image: PDS_ASSETS.experienceViews },
          { title: t('channels.email.title'), copy: t('channels.email.desc'), image: PDS_ASSETS.experienceComfort },
          { title: t('schedule.title'), copy: `${t('schedule.days')} · ${t('schedule.hours')}`, image: PDS_ASSETS.experienceJourney }
        ]}
      />

      <SourceStatsSection
        eyebrow={t('form_section.description')}
        title={
          <>
            <span className="block">{t('form_section.title_1')}</span>
            <span className="block">{t('form_section.title_2')}</span>
          </>
        }
        stats={[
          { value: '24-48h', label: t('form_section.stats.delivery'), copy: t('cta_final.guarantees.delivery.desc') },
          { value: 'ISO', label: t('form_section.stats.quality'), copy: t('cta_final.guarantees.quality.desc') },
          { value: '1966', label: t('form_section.stats.foundation'), copy: tHero('since') },
          { value: '+55', label: t('form_section.stats.experience'), copy: t('cta_final.guarantees.support.desc') }
        ]}
      />

      <section id="contact-form" className="pds-section pds-dark">
        <div className="pds-grid gap-y-10">
          <div className="col-span-5 max-md:col-span-full">
            <span className="pds-eyebrow mb-4">{t('channels.description')}</span>
            <h2 className="pds-title mb-8">
              <span className="block">{t('channels.title_1')}</span>
              <span className="block">{t('channels.title_2')}</span>
            </h2>

            <div className="space-y-5 text-white/80">
              <a href="tel:+34968467514" className="flex items-center gap-3 text-xl text-white">
                <Phone className="h-5 w-5" />
                968 46 75 14
              </a>
              <a href="mailto:pedidos@granjamaripepa.com" className="flex items-center gap-3 text-xl text-white">
                <Mail className="h-5 w-5" />
                pedidos@granjamaripepa.com
              </a>
              <p className="flex items-center gap-3 text-xl text-white">
                <MapPin className="h-5 w-5" />
                {t('channels.murcia.desc')}
              </p>
              <div className="pt-6">
                <h3 className="mb-2 text-2xl font-medium tracking-[-0.03em]">{t('schedule.title')}</h3>
                <p>{t('schedule.days')}</p>
                <p>{t('schedule.hours')}</p>
              </div>
            </div>
          </div>

          <div className="col-span-8 col-start-8 max-md:col-span-full">
            <form onSubmit={form.handleSubmit(onSubmit)} className="pds-form-surface space-y-5">
              <div>
                <span className="pds-eyebrow mb-3">{t('form_section.form_subtitle')}</span>
                <h2 className="pds-title mb-6 text-[clamp(2.5rem,5vw,5rem)]">{t('form_section.form_title')}</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm">{t('form_section.labels.name')}</span>
                  <input className="w-full px-4 py-3" placeholder={t('form_section.placeholders.name')} {...form.register('nombre')} />
                  {form.formState.errors.nombre && <span className="text-sm text-red-700">{form.formState.errors.nombre.message}</span>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm">{t('form_section.labels.company')}</span>
                  <input className="w-full px-4 py-3" placeholder={t('form_section.placeholders.company')} {...form.register('empresa')} />
                  {form.formState.errors.empresa && <span className="text-sm text-red-700">{form.formState.errors.empresa.message}</span>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm">{t('form_section.labels.email')}</span>
                  <input className="w-full px-4 py-3" placeholder={t('form_section.placeholders.email')} {...form.register('email')} />
                  {form.formState.errors.email && <span className="text-sm text-red-700">{form.formState.errors.email.message}</span>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm">{t('form_section.labels.phone')}</span>
                  <input className="w-full px-4 py-3" placeholder={t('form_section.placeholders.phone')} {...form.register('telefono')} />
                  {form.formState.errors.telefono && <span className="text-sm text-red-700">{form.formState.errors.telefono.message}</span>}
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm">{t('form_section.labels.message')}</span>
                <textarea className="min-h-36 w-full px-4 py-3" placeholder={t('form_section.placeholders.message')} {...form.register('mensaje')} />
                {form.formState.errors.mensaje && <span className="text-sm text-red-700">{form.formState.errors.mensaje.message}</span>}
              </label>

              <label className="flex items-start gap-3 text-sm leading-tight">
                <input type="checkbox" className="mt-1 h-5 w-5" {...form.register('privacidad')} />
                <span>
                  {t('form_section.labels.privacy')}
                  <span className="block text-[#0e1620]/60">{t('form_section.labels.privacy_desc')}</span>
                  {form.formState.errors.privacidad && <span className="block text-red-700">{form.formState.errors.privacidad.message}</span>}
                </span>
              </label>

              <button type="submit" disabled={isSubmitting} className="pds-button pds-button--dark">
                <Send className="h-5 w-5" />
                <span>{isSubmitting ? t('form_section.sending') : t('form_section.submit')}</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
