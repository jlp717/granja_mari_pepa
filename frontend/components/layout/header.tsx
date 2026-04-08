'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Menu, X, ShoppingCart, ChevronDown, User } from 'lucide-react';
import { Link, usePathname } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/store';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/cart/cart-drawer';

interface NavBrand {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon?: 'user';
  brands?: NavBrand[];
}

export function Header() {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tBrands = useTranslations('brands');
  const tHeader = useTranslations('header');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const { getTotalItems, toggleCart } = useCartStore();

  const navigation: NavItem[] = [
    {
      name: tNav('products'),
      href: '/productos',
      brands: [
        { name: tBrands('grupo-topgel.name'), href: '/productos?brand=grupo-topgel' },
        { name: tBrands('nestle.name'), href: '/productos?brand=nestle' },
        { name: tBrands('panamar.name'), href: '/productos?brand=panamar' },
      ],
    },
    { name: tNav('about'), href: '/acerca' },
    { name: tNav('contact'), href: '/contacto' },
    { name: tNav('customerArea'), href: '/area-clientes', icon: 'user' },
  ];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 16);

      if (isMenuOpen) {
        setIsNavHidden(false);
        lastY = currentY;
        return;
      }

      const isGoingDown = currentY > lastY;
      const hideThreshold = 120;
      setIsNavHidden(isGoingDown && currentY > hideThreshold);
      lastY = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setActiveSubmenu(null);
  }, []);

  const cartItemsCount = isHydrated ? getTotalItems() : 0;

  const navBaseStyle = {
    backgroundColor: isScrolled || pathname !== '/' ? 'rgba(245, 244, 223, 0.96)' : 'rgba(245, 244, 223, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(14, 22, 32, 0.12)',
    transform: isNavHidden ? 'translateY(-100%)' : 'translateY(0)',
  };

  return (
    <>
      <nav className="nav" style={navBaseStyle}>
        <div className="grid-inner" style={{ height: '100%', alignItems: 'center' }}>
          <Link
            href="/"
            className="logo-animated"
            style={{ gridColumn: '1 / span 3', zIndex: 120 }}
            aria-label={tNav('home')}
            onClick={closeMenu}
          >
            <Image
              src="/clone/images/logo-animated-256.webp"
              alt="Granja Mari Pepa"
              width={132}
              height={48}
              style={{ width: '132px', height: 'auto' }}
              priority
            />
          </Link>

          <div
            className="hidden lg:flex"
            style={{
              gridColumn: '4 / span 10',
              justifyContent: 'center',
              gap: '2.4rem',
              alignItems: 'center',
            }}
          >
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href === '/productos' && pathname.startsWith('/productos'));

              if (!item.brands) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-button dark"
                    style={{
                      color: isActive ? 'var(--color-blue)' : 'var(--color-black)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {item.icon === 'user' && <User className="h-4 w-4" />}
                    {item.name}
                  </Link>
                );
              }

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setActiveSubmenu(item.name)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <button
                    type="button"
                    className="inline-button dark"
                    style={{
                      color: isActive ? 'var(--color-blue)' : 'var(--color-black)',
                      border: 'none',
                      background: 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                    aria-haspopup="menu"
                    aria-expanded={activeSubmenu === item.name}
                  >
                    {item.name}
                    <ChevronDown
                      className="h-3.5 w-3.5"
                      style={{ transform: activeSubmenu === item.name ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                    />
                  </button>

                  {activeSubmenu === item.name && (
                    <div
                      className="absolute right-0 top-full mt-3 min-w-[260px] rounded-2xl border p-3 shadow-2xl"
                      style={{
                        backgroundColor: 'var(--color-beige)',
                        borderColor: 'rgba(14, 22, 32, 0.12)',
                      }}
                    >
                      {item.brands.map((brand) => (
                        <Link
                          key={brand.href}
                          href={brand.href}
                          className="block rounded-xl px-4 py-3 text-sm transition-colors"
                          style={{
                            color: 'var(--color-black)',
                          }}
                          onClick={() => setActiveSubmenu(null)}
                        >
                          {brand.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="hidden lg:flex"
            style={{
              gridColumn: '14 / span 3',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.75rem',
              zIndex: 121,
            }}
          >
            <LanguageSwitcher variant="default" />
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={toggleCart}
              aria-label={tHeader('cart_label', { count: cartItemsCount })}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--color-blue)',
                    color: 'var(--color-white)',
                  }}
                >
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </div>

          <div
            className="flex lg:hidden"
            style={{
              gridColumn: '5 / span 2',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.6rem',
              zIndex: 121,
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={toggleCart}
              aria-label={tHeader('cart_label', { count: cartItemsCount })}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--color-blue)',
                    color: 'var(--color-white)',
                  }}
                >
                  {cartItemsCount}
                </span>
              )}
            </Button>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="rounded-full p-2"
              style={{ backgroundColor: 'rgba(0, 122, 229, 0.1)' }}
              aria-label={isMenuOpen ? tHeader('close_menu') : tHeader('open_menu')}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <div className={isMenuOpen ? 'nav-overlay-bg active' : 'nav-overlay-bg'} onClick={closeMenu} />

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          height: '100vh',
          backgroundColor: 'var(--color-blue)',
          zIndex: 140,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.6rem',
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s var(--ease-out-cubic)',
        }}
      >
        <div className="mb-6 flex items-center">
          <LanguageSwitcher variant="minimal" className="text-white" />
        </div>

        {navigation.map((item) => (
          <div key={`mobile-${item.href}`} className="w-full px-8 text-center">
            <Link
              href={item.href}
              onClick={closeMenu}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-display)',
                fontSize: '2.2rem',
                fontWeight: 550,
                color: 'var(--color-white)',
                textDecoration: 'none',
              }}
            >
              {item.icon === 'user' && <User className="h-5 w-5" />}
              {item.name}
            </Link>

            {item.brands && (
              <div className="mt-3 flex flex-col gap-2">
                {item.brands.map((brand) => (
                  <Link
                    key={`mobile-brand-${brand.href}`}
                    href={brand.href}
                    onClick={closeMenu}
                    style={{
                      fontFamily: 'var(--font-text)',
                      fontSize: '1rem',
                      color: 'rgba(245,244,223,0.84)',
                      textDecoration: 'none',
                    }}
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <CartDrawer />
    </>
  );
}
