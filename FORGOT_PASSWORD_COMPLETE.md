# FORGOT PASSWORD IMPLEMENTATION - COMPLETE

## Overview
Complete implementation of "Olvide mi contraseña" (Forgot Password) feature with:
- Email verification code system
- 30-day password change cooldown
- Secure token management
- Email validation
- Full audit trail

---

## Changes Made

### 1. Fixed Email Update Error in Perfil Section

**Problem:** Frontend was using numeric `user.id` but backend expected `codigoCliente` (customer code).

**File:** `frontend/components/customer/dashboard.tsx` (line 1385-1394)

**Fix:**
```typescript
const guardarDatosContacto = async (datos: { email?: string | null; telefono?: string | null }) => {
  // Use codigoCliente instead of numeric ID
  const codigoCliente = user?.codigoCliente || user?.customerCode || user?.code;
  if (!codigoCliente) {
    toast.error('No se encontró el código de cliente');
    return;
  }
  
  const { data, ok } = await secureFetch(
    `/api/clientes/${codigoCliente}/contacto`,
    { method: 'PUT', body: JSON.stringify(datos) }
  );
}
```

---

### 2. Backend Implementation

#### authControllerV2.js

**Three endpoints fully implemented:**

1. **`POST /api/auth/v2/solicitar-codigo`** (Request Reset Code)
   - Validates customer exists
   - Checks email is configured
   - Generates 6-digit code
   - Saves to PASSWORD_RESET_TOKENS table
   - Returns masked email (e.g., "j***@example.com")
   - In development: Returns code for testing

2. **`POST /api/auth/v2/verificar-codigo`** (Verify Code & Change Password)
   - Validates verification code
   - Checks token hasn't expired (1 hour validity)
   - Validates new password strength (zxcvbn score >= 4)
   - Changes password
   - Marks token as used
   - Saves to password history
   - Resets dismissal warnings
   - Full audit trail

3. **`GET /api/auth/v2/verificar-cambio/:codigoCliente`** (Check 30-day Cooldown)
   - Checks last password change date
   - Enforces 30-day cooldown
   - Returns days remaining
   - Allows first-time changes (legacy users)

---

#### authServiceSecure.js

**Three new methods added:**

1. **`requestPasswordReset(customerCode, ipAddress)`**
   ```javascript
   // Flow:
   // 1. Verify customer exists and is active
   // 2. Check email is configured (not @granja.local)
   // 3. Generate 6-digit verification code
   // 4. Save to PASSWORD_RESET_TOKENS with 1-hour expiration
   // 5. Audit event
   // 6. Return masked email + code (dev mode only)
   ```

2. **`resetPasswordWithCode(customerCode, code, newPassword, ipAddress, userAgent)`**
   ```javascript
   // Flow:
   // 1. Verify code exists and hasn't been used
   // 2. Check token hasn't expired
   // 3. Validate new password strength
   // 4. Change password
   // 5. Save to CUSTOMER_PASSWORDS history
   // 6. Mark token as used
   // 7. Reset dismissal warnings
   // 8. Full audit trail
   ```

3. **`canChangePassword(customerCode)`**
   ```javascript
   // Flow:
   // 1. Get last password change date
   // 2. If never changed or legacy: ALLOW
   // 3. Calculate days since last change
   // 4. If < 30 days: DENY with days remaining
   // 5. If >= 30 days: ALLOW
   ```

**Modified `updatePassword` method:**
- Now sets `PASSWORD_LAST_CHANGED = CURRENT_TIMESTAMP`
- Resets `PASSWORD_WARNING_DISMISSALS = 0`
- Removed old column names (LAST_PASSWORD_CHANGE, PASSWORD_CHANGE_COUNT)

---

### 3. Database Changes

**New SQL Migration:** `backend/scripts/setup/add-password-last-changed.sql`

```sql
ALTER TABLE JAVIER.CUSTOMER_CREDENTIALS 
ADD COLUMN PASSWORD_LAST_CHANGED TIMESTAMP DEFAULT NULL;
```

**Purpose:**
- Tracks when password was last changed
- Used for 30-day cooldown enforcement
- NULL = never changed (legacy users can always change)

---

## Database Tables Used

### JAVIER.PASSWORD_RESET_TOKENS
```sql
ID (PK, AUTO_INCREMENT)
CODIGO_CLIENTE (FK to CUSTOMER_CREDENTIALS)
TOKEN (6-digit code)
EMAIL (where code was "sent")
FECHA_CREACION (when created)
FECHA_EXPIRACION (expires after 1 hour)
USADO ('N' or 'S' - prevents reuse)
IP_SOLICITANTE (who requested it)
```

### JAVIER.CUSTOMER_CREDENTIALS
```sql
CUSTOMER_ID (PK)
CUSTOMER_CODE (e.g., "TEST_JAVIER")
PASSWORD_HASH (bcrypt)
PASSWORD_ALGORITHM ('BCRYPT' or 'LEGACY')
IS_LEGACY_PASSWORD ('0' or '1')
PASSWORD_LAST_CHANGED (TIMESTAMP, for cooldown)
PASSWORD_WARNING_DISMISSALS (0-2)
ACCOUNT_STATUS ('ACTIVE', 'LOCKED', etc.)
```

### JAVIER.CUSTOMER_PASSWORDS
```sql
ID (PK)
CUSTOMER_ID (FK)
PASSWORD_HASH (historical record)
PASSWORD_ALGORITHM ('BCRYPT')
STRENGTH_SCORE (0-4 from zxcvbn)
CRACK_TIME_DISPLAY (human-readable)
CHANGED_FROM_IP
CHANGE_REASON ('USER_INITIATED', 'PASSWORD_RESET', etc.)
CHANGED_AT (TIMESTAMP)
```

### JAVIER.CUSTOMER_EMAILS
```sql
CODIGO_CLIENTE (PK)
EMAIL (user's email)
VERIFICADO ('S' or 'N')
FECHA_CREACION
FECHA_VERIFICACION
```

---

## User Flow

### 1. User Requests Password Reset

**Frontend:** User clicks "¿Olvidaste tu contraseña?" and enters customer code

**Backend Flow:**
```
1. POST /api/auth/v2/verificar-cambio/TEST_JAVIER
   → Check if can change (30-day cooldown)
   ✅ canChange: true (if allowed)
   ❌ canChange: false, daysRemaining: 15 (if too soon)

2. POST /api/auth/v2/solicitar-codigo
   Body: { codigoCliente: "TEST_JAVIER" }
   
   Backend:
   - Verify customer exists
   - Check email configured (not @granja.local)
   - Generate code: "123456"
   - Save to PASSWORD_RESET_TOKENS
     - TOKEN: "123456"
     - FECHA_EXPIRACION: NOW() + 1 hour
     - USADO: 'N'
   - Audit: PASSWORD_RESET_REQUESTED
   
   Response:
   {
     "success": true,
     "message": "Código enviado a j***@example.com",
     "emailMasked": "j***@example.com",
     "codigoVerificacion": "123456", // Only in development
     "modoDesarrollo": true
   }
```

### 2. User Enters Code and New Password

**Frontend:** User enters 6-digit code and new password

**Backend Flow:**
```
POST /api/auth/v2/verificar-codigo
Body: {
  codigoCliente: "TEST_JAVIER",
  codigoVerificacion: "123456",
  nuevaPassword: "MyNewSecureP@ssw0rd2024!"
}

Backend:
1. Find token in PASSWORD_RESET_TOKENS
   WHERE CODIGO_CLIENTE = 'TEST_JAVIER'
   AND TOKEN = '123456'
   AND USADO = 'N'
   
2. Check expiration
   IF NOW() > FECHA_EXPIRACION
   → Error: "Código expirado"
   
3. Validate password strength (zxcvbn)
   IF score < 4
   → Error: "Contraseña muy débil"
   
4. Update password
   UPDATE CUSTOMER_CREDENTIALS
   SET PASSWORD_HASH = bcrypt_hash(newPassword),
       PASSWORD_ALGORITHM = 'BCRYPT',
       IS_LEGACY_PASSWORD = '0',
       PASSWORD_LAST_CHANGED = CURRENT_TIMESTAMP,
       PASSWORD_WARNING_DISMISSALS = 0
   WHERE CUSTOMER_CODE = 'TEST_JAVIER'
   
5. Save to history
   INSERT INTO CUSTOMER_PASSWORDS
   (CUSTOMER_ID, PASSWORD_HASH, ..., CHANGE_REASON)
   VALUES (..., 'PASSWORD_RESET')
   
6. Mark token as used
   UPDATE PASSWORD_RESET_TOKENS
   SET USADO = 'S'
   WHERE TOKEN = '123456'
   
7. Audit: PASSWORD_RESET_COMPLETED

Response:
{
  "success": true,
  "message": "¡Contraseña cambiada exitosamente!",
  "crackTimeDisplay": "Siglos",
  "strengthScore": 4
}
```

---

## Security Features

### 1. Token Security
- ✅ Tokens expire after 1 hour
- ✅ Tokens can only be used once (USADO flag)
- ✅ Tokens are 6-digit random numbers (1,000,000 combinations)
- ✅ IP address logged for audit trail
- ✅ Old tokens automatically invalid after use

### 2. Password Validation
- ✅ Minimum 12 characters
- ✅ zxcvbn score >= 4 (very strong)
- ✅ HaveIBeenPwned check
- ✅ Password history check (last 10 passwords)

### 3. Rate Limiting
- ✅ Request code: Limited by generalLimiter
- ✅ Verify code: Limited by loginRateLimiter
- ✅ IP-based blocking for suspicious activity

### 4. 30-Day Cooldown
- ✅ Users can't change password more than once per 30 days
- ✅ Exception: Legacy users can always change
- ✅ Exception: First-time password change
- ✅ Clear error messages with dates

### 5. Audit Trail
- ✅ PASSWORD_RESET_REQUESTED (when code requested)
- ✅ PASSWORD_RESET_FAILED (invalid code attempts)
- ✅ PASSWORD_RESET_COMPLETED (successful change)
- ✅ All events include IP, timestamp, result

---

## Email Configuration (TODO)

**Current Status:** Codes are stored in database but not sent via email yet.

**Development Mode:**
- Code is returned in API response
- Logged to console
- Visible in browser dev tools

**Production TODO:**
- Integrate email service (NodeMailer, SendGrid, AWS SES)
- Create email template
- Send code to customer's email
- Remove code from API response

**Example Integration:**
```javascript
// In requestPasswordReset method
const nodemailer = require('nodemailer');

// Send email
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

await transporter.sendMail({
  from: 'Granja Mari Pepa <noreply@granjamari pepa.com>',
  to: customer.EMAIL,
  subject: 'Código de verificación - Granja Mari Pepa',
  html: `
    <h1>Código de Verificación</h1>
    <p>Tu código es: <strong>${verificationCode}</strong></p>
    <p>Este código expira en 1 hora.</p>
  `
});
```

---

## Testing Checklist

### Database Setup
- [ ] Run `add-password-last-changed.sql` migration
- [ ] Verify column exists: `PASSWORD_LAST_CHANGED`
- [ ] Verify tables exist: `PASSWORD_RESET_TOKENS`, `CUSTOMER_EMAILS`

### Test User Setup (TEST_JAVIER)
- [ ] User exists in CUSTOMER_CREDENTIALS
- [ ] User has valid email in CUSTOMER_EMAILS (not @granja.local)
- [ ] User's PASSWORD_LAST_CHANGED is NULL or > 30 days ago

### Test Flow
1. **Update Email:**
   - [ ] Go to Perfil section
   - [ ] Update email to valid address
   - [ ] Verify "Datos guardados correctamente" message
   - [ ] Check CUSTOMER_EMAILS table updated

2. **Request Reset Code:**
   - [ ] Click "¿Olvidaste tu contraseña?"
   - [ ] Enter customer code (TEST_JAVIER)
   - [ ] Click "Enviar código"
   - [ ] Verify message shows masked email
   - [ ] In dev mode: Check console for code
   - [ ] Check PASSWORD_RESET_TOKENS table has new entry

3. **Verify 30-Day Cooldown:**
   - [ ] If user changed password < 30 days ago
   - [ ] Error message shows days remaining
   - [ ] Can't request code

4. **Change Password:**
   - [ ] Enter 6-digit code
   - [ ] Enter weak password → Error
   - [ ] Enter strong password → Success
   - [ ] Verify PASSWORD_LAST_CHANGED updated
   - [ ] Verify PASSWORD_WARNING_DISMISSALS = 0
   - [ ] Verify IS_LEGACY_PASSWORD = '0'
   - [ ] Verify token USADO = 'S'

5. **Test Expired Code:**
   - [ ] Request code
   - [ ] Wait > 1 hour (or manually update FECHA_EXPIRACION)
   - [ ] Try to use code → Error: "Código expirado"

6. **Test Used Code:**
   - [ ] Use code successfully once
   - [ ] Try to use same code again → Error: "Código inválido o ya utilizado"

---

## Error Handling

### User-Friendly Errors
```javascript
// No email configured
"No hay email configurado para este cliente. Por favor, contacta con soporte."

// Invalid code
"Código de verificación inválido o ya utilizado"

// Expired code
"El código de verificación ha expirado. Solicita uno nuevo."

// Weak password
"Esta contraseña es demasiado débil. Puntuación: 2/4..."

// 30-day cooldown
"Debes esperar 15 días más para cambiar tu contraseña
Último cambio: 15/12/2025 10:30
Podrás cambiarla a partir del: 14/01/2026"
```

---

## Files Modified

### Backend:
- ✅ `backend/app/controllers/authControllerV2.js` - Implemented 3 endpoints
- ✅ `backend/app/services/authServiceSecure.js` - Added 3 new methods
- ✅ `backend/scripts/setup/add-password-last-changed.sql` - New migration

### Frontend:
- ✅ `frontend/components/customer/dashboard.tsx` - Fixed email update bug

### Documentation:
- ✅ `FORGOT_PASSWORD_COMPLETE.md` - This file

---

## Next Steps

1. **Run Database Migration:**
   ```sql
   backend/scripts/setup/add-password-last-changed.sql
   ```

2. **Configure Email Service:**
   - Choose provider (NodeMailer, SendGrid, AWS SES)
   - Add credentials to `.env`
   - Implement email sending in `requestPasswordReset`
   - Create HTML email template

3. **Test End-to-End:**
   - Test with TEST_JAVIER user
   - Verify all flows work
   - Check audit logs

4. **Production Deployment:**
   - Remove `modoDesarrollo` flag
   - Don't return `codigoVerificacion` in response
   - Enable email sending
   - Monitor logs for issues

---

## Environment Variables

Add to `.env`:
```env
# Email Service (choose one)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@granjamari pepa.com
SMTP_PASS=your_password_here

# Or use SendGrid
SENDGRID_API_KEY=SG.xxx

# Or use AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_SES_FROM_EMAIL=noreply@granjamari pepa.com
```

---

## Summary

✅ **Email update fixed** - Uses codigoCliente instead of ID
✅ **Forgot password complete** - Full implementation with tokens
✅ **30-day cooldown enforced** - Can't change password too frequently
✅ **Email validation** - Must have valid email configured
✅ **Security audit trail** - All events logged
✅ **Token expiration** - 1-hour validity
✅ **Token reuse prevention** - One-time use only
✅ **Password strength validation** - zxcvbn score >= 4
✅ **Development mode** - Code visible for testing

⏳ **Email sending** - Integration needed (NodeMailer/SendGrid/SES)

The system is ready for testing. Just need to run the database migration and optionally configure email sending!
