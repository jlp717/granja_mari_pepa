# 🔐 GUÍA DE MIGRACIÓN DE SEGURIDAD - FRONTEND

## Migración de Tokens: localStorage → HttpOnly Cookies

Esta guía detalla los cambios necesarios en el frontend para completar la migración de seguridad.

---

## 📋 RESUMEN DE CAMBIOS

| Componente | Antes | Después |
|------------|-------|---------|
| Access Token | `localStorage.getItem('token')` | Cookie `__Host-access_token` (automático) |
| Refresh Token | `localStorage.getItem('refreshToken')` | Cookie `__Host-refresh_token` (automático) |
| CSRF Token | No implementado | Header `X-CSRF-Token` en requests mutantes |
| Credentials | `include` en algunos fetch | `include` en TODOS los fetch |

---

## 🔧 CAMBIOS REQUERIDOS

### 1. Configurar Axios/Fetch con credentials

**Archivo:** `frontend/lib/api.ts` o similar

```typescript
// ANTES
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// DESPUÉS
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ⚠️ CRÍTICO: Enviar cookies automáticamente
});
```

### 2. Interceptor para CSRF Token

```typescript
// Obtener CSRF token al iniciar la app
let csrfToken: string | null = null;

async function fetchCSRFToken() {
  try {
    const response = await api.get('/api/security/csrf-token');
    csrfToken = response.data.token;
  } catch (error) {
    console.error('Error obteniendo CSRF token:', error);
  }
}

// Interceptor para añadir CSRF token a requests mutantes
api.interceptors.request.use((config) => {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (config.method && mutatingMethods.includes(config.method.toUpperCase())) {
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  return config;
});

// Llamar al iniciar
fetchCSRFToken();
```

### 3. Eliminar manejo manual de tokens en localStorage

**Archivo:** `frontend/contexts/AuthContext.tsx` o similar

```typescript
// ANTES - ELIMINAR ESTO
const login = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', { email, password });
  localStorage.setItem('token', response.data.accessToken); // ❌ ELIMINAR
  localStorage.setItem('refreshToken', response.data.refreshToken); // ❌ ELIMINAR
};

// DESPUÉS - Solo hacer la request, el backend setea las cookies
const login = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', { email, password });
  // Las cookies se setean automáticamente por el backend
  // Solo actualizar el estado local
  setUser(response.data.user);
  setIsAuthenticated(true);
};
```

### 4. Actualizar verificación de autenticación

```typescript
// ANTES - ELIMINAR
const isAuthenticated = () => {
  return !!localStorage.getItem('token'); // ❌ ELIMINAR
};

// DESPUÉS - Verificar con el backend
const checkAuth = async () => {
  try {
    const response = await api.get('/api/auth/me');
    setUser(response.data.user);
    setIsAuthenticated(true);
    return true;
  } catch {
    setUser(null);
    setIsAuthenticated(false);
    return false;
  }
};
```

### 5. Actualizar logout

```typescript
// DESPUÉS
const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } finally {
    // El backend borra las cookies con Clear-Site-Data
    setUser(null);
    setIsAuthenticated(false);
    // Limpiar cualquier estado local restante
    localStorage.removeItem('user'); // Solo datos no sensibles
  }
};
```

### 6. Actualizar refresh token handling

```typescript
// Interceptor para refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // El refresh token está en cookie, solo hacer la request
        await api.post('/api/auth/refresh');
        // Reintentar request original
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló, redirigir a login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 📁 ARCHIVOS A MODIFICAR

| Archivo | Cambio |
|---------|--------|
| `lib/api.ts` | Añadir `withCredentials: true` |
| `contexts/AuthContext.tsx` | Eliminar localStorage, usar cookies |
| `hooks/useAuth.ts` | Actualizar lógica de verificación |
| `components/LoginForm.tsx` | Eliminar manejo de tokens |
| `middleware.ts` | Actualizar verificación SSR |

---

## ⚠️ NOTAS IMPORTANTES

### CORS
El backend ya está configurado con `credentials: true`. Asegúrate de que `CORS_ORIGIN` incluya el dominio del frontend.

### SameSite=Strict
Las cookies tienen `SameSite=Strict`, lo que significa:
- ✅ Requests desde el mismo sitio funcionan
- ❌ Requests desde otros sitios no envían cookies
- ⚠️ Links externos a tu app no tendrán sesión (el usuario deberá re-autenticarse)

### Desarrollo Local
En desarrollo con diferentes puertos (3000 frontend, 3001 backend):
- Usa el mismo hostname (`localhost`)
- O configura un proxy en `next.config.js`

### SSR/SSG
Para Server Components en Next.js 13+:
- Las cookies se pasan automáticamente en requests del servidor
- Usa `cookies()` de `next/headers` para leer el estado de autenticación

```typescript
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = cookies();
  // Las cookies HttpOnly no son legibles, pero su presencia indica auth
  // Mejor hacer una request al backend para verificar
}
```

---

## ✅ CHECKLIST DE MIGRACIÓN

- [ ] Añadir `withCredentials: true` a Axios/fetch
- [ ] Implementar interceptor de CSRF token
- [ ] Eliminar `localStorage.setItem('token', ...)` en login
- [ ] Eliminar `localStorage.getItem('token')` en verificaciones
- [ ] Actualizar logout para llamar al backend
- [ ] Implementar refresh token interceptor
- [ ] Probar flujo completo de autenticación
- [ ] Probar en diferentes navegadores
- [ ] Verificar que las cookies se setean correctamente (DevTools → Application → Cookies)

---

## 🧪 TESTING

```javascript
// En la consola del navegador, verificar:
document.cookie // NO debe mostrar access_token ni refresh_token (son HttpOnly)

// En Network tab, verificar headers de respuesta:
// Set-Cookie: __Host-access_token=...; HttpOnly; Secure; SameSite=Strict; Path=/
```

---

**Tiempo estimado de migración:** 4-6 horas  
**Riesgo:** Medio (requiere testing exhaustivo)  
**Impacto:** Mejora significativa de seguridad  
