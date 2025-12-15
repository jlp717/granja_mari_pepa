import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock de useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Componentes básicos', () => {
  describe('Renderizado inicial', () => {
    it('debería renderizar correctamente', () => {
      const TestComponent = () => <div data-testid="test">Hello World</div>;
      render(<TestComponent />);
      
      expect(screen.getByTestId('test')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });
});

describe('Utilidades', () => {
  describe('formatPrice', () => {
    it('debería formatear precios correctamente', () => {
      const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }).format(price);
      };
      
      expect(formatPrice(10)).toContain('10');
      expect(formatPrice(10.50)).toContain('10,50');
      expect(formatPrice(1000)).toContain('1.000');
    });
  });

  describe('formatDate', () => {
    it('debería formatear fechas correctamente', () => {
      const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('es-ES');
      };
      
      expect(formatDate('2024-01-15')).toBe('15/1/2024');
      expect(formatDate('2024-12-31')).toBe('31/12/2024');
    });
  });
});

describe('Validaciones', () => {
  describe('Email validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('debería validar emails correctos', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.es')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('debería rechazar emails incorrectos', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
    });
  });

  describe('Phone validation', () => {
    const isValidPhone = (phone: string): boolean => {
      const phoneRegex = /^(\+34)?[\s]?[6789]\d{8}$/;
      return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    it('debería validar teléfonos españoles', () => {
      expect(isValidPhone('612345678')).toBe(true);
      expect(isValidPhone('912345678')).toBe(true);
      expect(isValidPhone('+34612345678')).toBe(true);
    });

    it('debería rechazar teléfonos inválidos', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('1234567890')).toBe(false);
    });
  });

  describe('CIF/NIF validation', () => {
    const isValidCIF = (cif: string): boolean => {
      const cifRegex = /^[A-Z]\d{7}[A-Z0-9]$/;
      return cifRegex.test(cif.toUpperCase());
    };

    it('debería validar CIFs correctos', () => {
      expect(isValidCIF('A12345678')).toBe(true);
      expect(isValidCIF('B98765432')).toBe(true);
    });

    it('debería rechazar CIFs incorrectos', () => {
      expect(isValidCIF('12345678A')).toBe(false);
      expect(isValidCIF('ABC12345')).toBe(false);
    });
  });
});

describe('Helpers de strings', () => {
  describe('truncate', () => {
    const truncate = (str: string, maxLength: number): string => {
      if (str.length <= maxLength) return str;
      return str.slice(0, maxLength) + '...';
    };

    it('debería truncar strings largos', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Short', 10)).toBe('Short');
    });
  });

  describe('slugify', () => {
    const slugify = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    it('debería crear slugs válidos', () => {
      expect(slugify('Hola Mundo')).toBe('hola-mundo');
      expect(slugify('Café con leche')).toBe('cafe-con-leche');
      expect(slugify('Producto 123!')).toBe('producto-123');
    });
  });
});
