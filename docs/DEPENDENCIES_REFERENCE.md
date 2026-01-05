# REFERENCIA DE DEPENDENCIAS - SISTEMA DE AUTENTICACIÓN

## Backend Dependencies

### Core Authentication

```json
{
  "argon2": "^0.31.2"
}
```
**Propósito:** Hashing de contraseñas con Argon2id (recomendado por NIST SP 800-63B)

**Uso:**
```javascript
const argon2 = require('argon2');

// Hashear contraseña
const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,
    parallelism: 4
});

// Verificar contraseña
const isValid = await argon2.verify(hash, password);
```

---

```json
{
  "jsonwebtoken": "^9.0.2"
}
```
**Propósito:** Generación y verificación de JWT (JSON Web Tokens)

**Uso:**
```javascript
const jwt = require('jsonwebtoken');

// Generar token
const token = jwt.sign({ customerId: 123 }, JWT_SECRET, {
    expiresIn: '15m'
});

// Verificar token
jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) throw new Error('Token inválido');
    console.log(decoded.customerId); // 123
});
```

---

```json
{
  "zxcvbn": "^4.4.2"
}
```
**Propósito:** Evaluación de fortaleza de contraseñas (desarrollado por Dropbox)

**Uso:**
```javascript
const zxcvbn = require('zxcvbn');

const result = zxcvbn('mi-perro-firulais-2024', [
    'usuario',
    'granjamaripepa'
]);

console.log(result.score); // 0-4 (4 = muy fuerte)
console.log(result.crack_times_display.offline_slow_hashing_1e4_per_second);
// "miles de millones de años"
console.log(result.feedback.suggestions);
// ["Añade otra palabra o dos. Palabras poco comunes son mejores."]
```

**Por qué zxcvbn y no reglas de composición:**
- Mide entropía REAL, no caracteres obligatorios
- Detecta patrones comunes (keyboard walks, secuencias, fechas)
- Estima tiempo de crackeo con hardware real
- Proporciona feedback educativo útil

---

```json
{
  "axios": "^1.6.2"
}
```
**Propósito:** Cliente HTTP para consultar API HaveIBeenPwned

**Uso:**
```javascript
const axios = require('axios');
const crypto = require('crypto');

async function checkPasswordPwned(password) {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const response = await axios.get(
        `https://api.pwnedpasswords.com/range/${prefix}`
    );

    const hashes = response.data.split('\n');
    return hashes.some(line => line.startsWith(suffix));
}
```

**k-anonymity:** Solo enviamos los primeros 5 caracteres del hash SHA-1, nunca la contraseña completa.

---

### Database

```json
{
  "ibm_db": "^3.2.3"
}
```
**Propósito:** Driver nativo para DB2 for i (IBM i / AS/400)

**Instalación (puede requerir herramientas de build):**
```bash
# Windows
npm install --global windows-build-tools
npm install ibm_db

# Linux
sudo apt-get install build-essential
npm install ibm_db
```

**Uso:**
```javascript
const ibmdb = require('ibm_db');

const connStr = `DATABASE=${DB};HOSTNAME=${HOST};PORT=${PORT};UID=${USER};PWD=${PASS};`;

ibmdb.open(connStr, (err, conn) => {
    conn.query('SELECT * FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = ?', ['9900'], (err, data) => {
        console.log(data);
    });
});
```

---

### Utilities

```json
{
  "dotenv": "^16.3.1"
}
```
**Propósito:** Cargar variables de entorno desde archivo `.env`

**Uso:**
```javascript
require('dotenv').config();

console.log(process.env.JWT_SECRET);
console.log(process.env.IBM_I_HOST);
```

---

```json
{
  "express": "^4.18.2"
}
```
**Propósito:** Framework web para Node.js

---

```json
{
  "cookie-parser": "^1.4.6"
}
```
**Propósito:** Parsear cookies (para refresh tokens httpOnly)

**Uso:**
```javascript
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Establecer cookie
res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
});

// Leer cookie
const refreshToken = req.cookies.refreshToken;
```

---

```json
{
  "express-rate-limit": "^7.1.5"
}
```
**Propósito:** Rate limiting para prevenir brute force

**Uso:**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5, // 5 requests
    message: 'Demasiados intentos'
});

app.use('/api/auth/login', loginLimiter);
```

---

## Frontend Dependencies

### Authentication UI

```json
{
  "zxcvbn": "^4.4.2"
}
```
**Propósito:** Evaluación de fortaleza en tiempo real (misma librería que backend)

**Uso en React:**
```typescript
import zxcvbn from 'zxcvbn';

const [strength, setStrength] = useState(null);

useEffect(() => {
    if (password.length > 0) {
        const result = zxcvbn(password);
        setStrength({
            score: result.score,
            crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
        });
    }
}, [password]);

return (
    <div>
        <progress value={strength.score} max={4} />
        <p>Fortaleza: {strength.score}/4</p>
        <p>Tiempo de crackeo: {strength.crackTime}</p>
    </div>
);
```

---

```json
{
  "lucide-react": "^0.298.0"
}
```
**Propósito:** Iconos SVG optimizados para React

**Uso:**
```typescript
import { Shield, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

return (
    <div>
        <Shield className="w-6 h-6 text-green-600" />
        <Lock className="w-5 h-5 text-blue-600" />
        <CheckCircle className="w-4 h-4 text-green-500" />
    </div>
);
```

**Iconos usados en el sistema:**
- `Shield`: Seguridad, protección
- `Lock`: Contraseñas, autenticación
- `Eye` / `EyeOff`: Mostrar/ocultar contraseña
- `CheckCircle`: Validación exitosa
- `XCircle`: Error, validación fallida
- `AlertTriangle`: Advertencia
- `Clock`: Tiempo de crackeo
- `Zap`: Acción rápida

---

### Framework

```json
{
  "next": "14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.3"
}
```
**Propósito:** Framework React con TypeScript

---

## package.json Completo de Referencia

### Backend

```json
{
  "name": "granja-mari-pepa-backend",
  "version": "2.0.0",
  "description": "Backend con autenticación de nivel bancario",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node scripts/hash-legacy-passwords.js",
    "test": "jest"
  },
  "dependencies": {
    "argon2": "^0.31.2",
    "axios": "^1.6.2",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "ibm_db": "^3.2.3",
    "jsonwebtoken": "^9.0.2",
    "zxcvbn": "^4.4.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### Frontend

```json
{
  "name": "granja-mari-pepa-frontend",
  "version": "2.0.0",
  "description": "Frontend con componentes de autenticación segura",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.0",
    "zxcvbn": "^4.4.2",
    "lucide-react": "^0.298.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18"
  }
}
```

---

## Comandos de Instalación

### Backend (completo)

```bash
cd backend
npm install argon2 axios cookie-parser dotenv express express-rate-limit ibm_db jsonwebtoken zxcvbn
npm install --save-dev nodemon
```

### Frontend (completo)

```bash
cd frontend
npm install zxcvbn lucide-react
```

---

## Versiones Mínimas Requeridas

| Dependencia | Versión Mínima | Razón |
|-------------|----------------|-------|
| Node.js | 18.0.0 | ES modules, crypto nativo |
| argon2 | 0.30.0 | Argon2id support |
| zxcvbn | 4.4.0 | Estimación de crack time precisa |
| jsonwebtoken | 9.0.0 | Soporte para algoritmos modernos |
| ibm_db | 3.0.0 | Compatibilidad DB2 for i v7.4+ |
| React | 18.0.0 | Hooks, Suspense |
| TypeScript | 5.0.0 | Satisfies operator, const type params |

---

## Alternativas Consideradas (y por qué NO se usaron)

### bcrypt vs. Argon2id
❌ **bcrypt**
- ✅ Ampliamente usado
- ❌ Solo usa CPU (vulnerable a GPUs/ASICs)
- ❌ No es la primera opción de NIST

✅ **Argon2id**
- ✅ Ganador de Password Hashing Competition 2015
- ✅ Resistente a GPUs (memory-hard)
- ✅ Recomendado como primera opción por NIST SP 800-63B
- ✅ Usado por 1Password, Bitwarden, etc.

### Reglas de composición vs. zxcvbn
❌ **Reglas de composición** (`/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/`)
- ❌ Reduce entropía (patrones predecibles)
- ❌ Frustra usuarios
- ❌ No mide fortaleza real
- ❌ Obsoleto según NIST 2017+

✅ **zxcvbn**
- ✅ Mide entropía real
- ✅ Detecta patrones comunes
- ✅ Feedback educativo
- ✅ Usado por Dropbox, Slack, GitHub

### Plain JWT vs. JWT + Refresh Token
❌ **Solo JWT con larga duración**
- ❌ No revocable
- ❌ Si se roba, válido hasta expiración

✅ **JWT (15 min) + Refresh Token (7 días)**
- ✅ Access token corto → menor ventana de ataque
- ✅ Refresh token revocable en DB
- ✅ Invalidación al cambiar contraseña

---

## Tamaños de Bundle

### Backend
- `argon2`: ~500 KB (binarios nativos)
- `zxcvbn`: ~800 KB (diccionarios)
- `ibm_db`: ~10 MB (driver nativo)

**Total:** ~50 MB (incluyendo node_modules completo)

### Frontend
- `zxcvbn`: ~800 KB (solo la librería, no diccionarios completos)
- `lucide-react`: ~50 KB (tree-shakeable, solo iconos usados)

**Impacto en bundle del cliente:** +850 KB (~30 KB gzipped con code splitting)

**Optimización:**
```typescript
// Lazy load zxcvbn solo cuando se necesita
const zxcvbn = await import('zxcvbn');
```

---

## Compatibilidad

### Node.js Versions
- ✅ Node 18.x (LTS)
- ✅ Node 20.x (LTS)
- ✅ Node 21.x (Current)

### Browsers (Frontend)
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### IBM i Versions
- ✅ IBM i 7.3
- ✅ IBM i 7.4
- ✅ IBM i 7.5

---

## Licencias

| Dependencia | Licencia | Uso Comercial |
|-------------|----------|---------------|
| argon2 | Apache-2.0 | ✅ Sí |
| zxcvbn | MIT | ✅ Sí |
| jsonwebtoken | MIT | ✅ Sí |
| axios | MIT | ✅ Sí |
| ibm_db | MIT | ✅ Sí |
| express | MIT | ✅ Sí |
| lucide-react | ISC | ✅ Sí |
| React | MIT | ✅ Sí |

**Todas las dependencias son de código abierto y aptas para uso comercial.**

---

## Instalación en Diferentes Entornos

### Docker

```dockerfile
FROM node:18-alpine

# Instalar herramientas de build para argon2 e ibm_db
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .
CMD ["node", "server.js"]
```

### Windows

```powershell
# Instalar build tools
npm install --global windows-build-tools

# Instalar dependencias
npm install
```

### Linux (Ubuntu/Debian)

```bash
# Instalar build tools
sudo apt-get update
sudo apt-get install -y build-essential python3

# Instalar dependencias
npm install
```

### macOS

```bash
# Xcode Command Line Tools (si no está instalado)
xcode-select --install

# Instalar dependencias
npm install
```

---

**Última actualización:** 2025-01-15
**Versión:** 1.0
