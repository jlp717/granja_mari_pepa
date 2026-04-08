'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Phone, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { delegations } from '@/lib/data';
import { toast } from 'sonner';

interface ContactFormData {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  mensaje: string;
  privacidad: boolean;
}

export default function ContactPage() {
  const t = useTranslations('contact_page');

  const schema = z.object({
    nombre: z.string().min(2, t('form_section.errors.name')),
    empresa: z.string().min(2, t('form_section.errors.company')),
    email: z.string().email(t('form_section.errors.email')),
    telefono: z.string().min(9, t('form_section.errors.phone')),
    mensaje: z.string().min(10, t('form_section.errors.message')),
    privacidad: z.boolean().refine((v) => v, t('form_section.errors.privacy')),
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      mensaje: '',
      privacidad: false,
    },
  });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success(t('form_section.success'));
    form.reset();
  };

  return (
    <div style={{ backgroundColor: 'var(--color-beige)' }}>
      <section className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: 'var(--color-navy)' }}>
        <div className="mx-auto max-w-5xl text-center">
          <p
            style={{
              fontFamily: 'var(--font-text)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.82rem',
              color: 'rgba(245,244,223,0.7)',
              marginBottom: '1rem',
            }}
          >
            {t('hero.badge')}
          </p>
          <h1 style={{ color: 'var(--color-beige)' }}>{t('hero.title')}</h1>
          <p
            className="mx-auto mt-6 max-w-3xl"
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1.15rem',
              lineHeight: 1.45,
              color: 'rgba(245,244,223,0.88)',
            }}
          >
            {t('hero.subtitle_1')} {t('hero.subtitle_highlight')} {t('hero.subtitle_2')}
          </p>
          <p
            className="mx-auto mt-4 max-w-3xl"
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1rem',
              lineHeight: 1.45,
              color: 'rgba(245,244,223,0.72)',
            }}
          >
            {t('hero.description')}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="tel:+34968467514" className="joby-button blue px-8 py-4" style={{ fontFamily: 'var(--font-text)' }}>
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" />
                968 46 75 14
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 style={{ color: 'var(--color-black)' }}>
              {t('channels.title_1')} {t('channels.title_2')}
            </h2>
            <p
              className="mx-auto mt-4 max-w-3xl"
              style={{
                fontFamily: 'var(--font-text)',
                color: 'rgba(14,22,32,0.72)',
                fontSize: '1rem',
                lineHeight: 1.45,
              }}
            >
              {t('channels.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <a href="tel:+34968467514" className="rounded-[24px] border bg-white p-6" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
              <Phone className="mb-4 h-6 w-6" style={{ color: 'var(--color-blue)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-black)', marginBottom: '0.4rem' }}>
                {t('channels.murcia.title')}
              </h3>
              <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.65)', marginBottom: '0.5rem' }}>
                {t('channels.murcia.desc')}
              </p>
              <p style={{ fontFamily: 'var(--font-text)', color: 'var(--color-black)' }}>968 46 75 14 / 639 77 86 55</p>
            </a>

            <a href="mailto:pedidos@granjamaripepa.com" className="rounded-[24px] border bg-white p-6" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
              <Mail className="mb-4 h-6 w-6" style={{ color: 'var(--color-blue)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-black)', marginBottom: '0.4rem' }}>
                {t('channels.email.title')}
              </h3>
              <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.65)', marginBottom: '0.5rem' }}>
                {t('channels.email.desc')}
              </p>
              <p style={{ fontFamily: 'var(--font-text)', color: 'var(--color-black)' }}>pedidos@granjamaripepa.com</p>
            </a>

            <a href="tel:+34950973429" className="rounded-[24px] border bg-white p-6" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
              <Phone className="mb-4 h-6 w-6" style={{ color: 'var(--color-blue)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-black)', marginBottom: '0.4rem' }}>
                {t('channels.almeria.title')}
              </h3>
              <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.65)', marginBottom: '0.5rem' }}>
                {t('channels.almeria.desc')}
              </p>
              <p style={{ fontFamily: 'var(--font-text)', color: 'var(--color-black)' }}>950 97 34 29 / 670 49 01 47</p>
            </a>
          </div>
        </div>
      </section>

      <section id="contact-form" className="px-6 pb-20 md:px-10 md:pb-28">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-[28px] p-8" style={{ backgroundColor: 'var(--color-navy)' }}>
            <h2 style={{ color: 'var(--color-beige)' }}>
              {t('form_section.title_1')} <br /> {t('form_section.title_2')}
            </h2>
            <p
              className="mt-6"
              style={{ fontFamily: 'var(--font-text)', color: 'rgba(245,244,223,0.8)', lineHeight: 1.45 }}
            >
              {t('form_section.description')}
            </p>

            <div className="mt-8 space-y-4" style={{ fontFamily: 'var(--font-text)', color: 'rgba(245,244,223,0.8)' }}>
              <p className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> {t('schedule.days')}: {t('schedule.hours')}</p>
              <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Lorca, Murcia</p>
            </div>
          </div>

          <div className="rounded-[28px] border bg-white p-8" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form_section.labels.name')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('form_section.placeholders.name')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="empresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form_section.labels.company')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('form_section.placeholders.company')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form_section.labels.email')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder={t('form_section.placeholders.email')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form_section.labels.phone')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('form_section.placeholders.phone')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="mensaje"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form_section.labels.message')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} placeholder={t('form_section.placeholders.message')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="privacidad"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>{t('form_section.labels.privacy')}</FormLabel>
                        <p className="text-xs text-muted-foreground">{t('form_section.labels.privacy_desc')}</p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="joby-button blue mt-2 w-full py-6">
                  <span className="inline-flex items-center justify-center gap-2">
                    {t('form_section.submit')}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center" style={{ color: 'var(--color-black)' }}>
            {t('locations.title_1')} {t('locations.title_2')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {delegations.map((delegation) => (
              <a
                key={delegation.id}
                href={delegation.mapUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[24px] border bg-white p-6"
                style={{ borderColor: 'rgba(14,22,32,0.12)' }}
              >
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--color-black)', marginBottom: '0.4rem' }}>
                  {delegation.city}
                </h3>
                <p style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.68)' }}>{delegation.address}</p>
                <p className="mt-2" style={{ fontFamily: 'var(--font-text)', color: 'var(--color-blue)' }}>{delegation.phone}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
