# 🧪 FORGOT PASSWORD FLOW - TESTING GUIDE

## ✅ Everything is Ready!

All the code has been fixed and is ready for testing. Both users (TEST_JAVIER and Diego) are in their original states.

---

## 🚀 Prerequisites

Make sure both servers are running:

```bash
# Terminal 1 - Backend (should already be running)
cd backend
npm start
# Should show: Servidor escuchando en puerto 5000

# Terminal 2 - Frontend (should already be running)  
cd frontend
npm run dev
# Should show: Ready on http://localhost:3000
```

---

## 🧪 TEST 1: TEST_JAVIER (User Without Email)

### Expected Flow:
1. User has NO email configured
2. System prompts for email configuration
3. User enters email
4. System sends verification code
5. User completes password reset

### Testing Steps:

1. **Open browser**: http://localhost:3000/area-clientes

2. **Click**: "¿Olvidaste tu contraseña?" (bottom of login form)

3. **Enter Customer Code**: `TEST_JAVIER`

4. **Click**: "Solicitar código"

5. **EXPECTED**: You should see an **amber/orange box** appear with:
   - Title: "Email requerido"
   - Message: "Para recuperar tu contraseña necesitas configurar tu email primero"
   - Input field for email
   - Button: "Configurar email y continuar"

6. **Enter Email**: `test@example.com` (or any valid email)

7. **Click**: "Configurar email y continuar"

8. **EXPECTED**: 
   - Success toast: "Email configurado correctamente"
   - Amber box disappears
   - Another toast: "Código de verificación enviado a test@example.com"
   - Modal advances to code entry step

9. **Check Console** (F12 → Console):
   - You should see: `🔑 Código de verificación (DEV): XXXXXX` (6 digits)
   - **Write down this code!**

10. **Enter the 6-digit code** from console

11. **Enter New Password**: 
    - Must be strong (score 4/4 on strength meter)
    - Example: `MyNewPassword123!`

12. **Confirm Password**: Same as above

13. **Click**: "Cambiar contraseña"

14. **EXPECTED**:
    - Success toast: "¡Contraseña cambiada exitosamente!"
    - Modal closes
    - You're back at login screen

15. **Test New Login**:
    - Code: `TEST_JAVIER`
    - Password: `MyNewPassword123!` (the one you just set)
    - Click "Iniciar sesión"
    - **EXPECTED**: Should login successfully!

---

## 🧪 TEST 2: DIEGO 9900 (User With Legacy Email)

### Expected Flow:
1. User has email in legacy system (DSEDAC.CLIP)
2. System directly sends verification code
3. User completes password reset

### Testing Steps:

1. **Make sure you're logged out** (if logged in from TEST_JAVIER test)

2. **Go to**: http://localhost:3000/area-clientes

3. **Click**: "¿Olvidaste tu contraseña?"

4. **Enter Customer Code**: `4300009900`

5. **Click**: "Solicitar código"

6. **EXPECTED**:
   - NO email prompt (should go directly to code step)
   - Success toast: "Código de verificación enviado a [masked email]"
   - Modal advances to code entry step

7. **Check Console** (F12 → Console):
   - You should see: `🔑 Código de verificación (DEV): XXXXXX`
   - **Write down this code!**

8. **Enter the 6-digit code** from console

9. **Enter New Password**: 
    - Example: `Diego2024Secure!`

10. **Confirm Password**: Same as above

11. **Click**: "Cambiar contraseña"

12. **EXPECTED**:
    - Success toast: "¡Contraseña cambiada exitosamente!"
    - Modal closes

13. **Test New Login**:
    - Code: `4300009900`
    - Password: `Diego2024Secure!`
    - Click "Iniciar sesión"
    - **EXPECTED**: Should login successfully!

---

## 🔄 Reset to Original States (For Re-testing)

### Reset TEST_JAVIER:
```bash
node backend/scripts/test/reset-test-javier.js
```
- Resets password to: `TEST123`
- Clears email configuration
- Resets to legacy password state

### Reset Diego 9900:
```bash
node backend/scripts/test/reset-diego-original.js
```
- Resets password to: `23224478K` (his NIF)
- Clears email configuration
- Resets to legacy password state

---

## ⚠️ Common Issues & Solutions

### Issue: "Error procesando solicitud de reset"
**Solution**: Check backend console for detailed error. Usually database connection issue.

### Issue: "CSRF token requerido"
**Solution**: Make sure you're testing from the browser (not curl/Postman). Frontend automatically handles CSRF.

### Issue: No verification code in console
**Solution**: Make sure `NODE_ENV !== 'production'` in backend .env file

### Issue: "Código de verificación inválido"
**Solutions**:
- Make sure you're using the LATEST code from console (codes expire after 1 hour)
- Make sure you entered all 6 digits correctly
- Check backend logs for detailed error

### Issue: Password strength too low
**Solution**: Use a password with:
- At least 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Example: `TestPass123!`

---

## 📊 What to Check

### ✅ Success Criteria:

1. **Email Configuration**:
   - [ ] TEST_JAVIER shows email prompt
   - [ ] Email can be configured successfully
   - [ ] After configuration, code is sent

2. **Code Generation**:
   - [ ] 6-digit code appears in dev console
   - [ ] Code is valid for 1 hour
   - [ ] Old codes become invalid after use

3. **Password Reset**:
   - [ ] New password must meet strength requirements
   - [ ] Password is successfully changed
   - [ ] Can login with new password

4. **Diego Flow**:
   - [ ] No email prompt (uses legacy email)
   - [ ] Code sent directly
   - [ ] Reset completes successfully

5. **Security**:
   - [ ] Codes are hashed in database
   - [ ] Old codes can't be reused
   - [ ] 30-day cooldown prevents rapid changes

---

## 🐛 Debugging

### Check Backend Logs:
```bash
# Backend terminal should show:
📧 Solicitar código de reset { codigoCliente: 'TEST_JAVIER', ipAddress: '::1' }
✅ Código de reset generado { customerCode: 'TEST_JAVIER', email: 't***@example.com' }
🔑 Password reset code generated ...
```

### Check Database:
```bash
node -e "const db = require('./backend/app/services/databaseService'); (async () => { const r = await db.executeQuery('SELECT CODE_ID, CUSTOMER_ID, CODE_TYPE, IS_USED, EXPIRES_AT FROM JAVIER.VERIFICATION_CODES ORDER BY CREATED_AT DESC FETCH FIRST 5 ROWS ONLY', []); console.log(JSON.stringify(r, null, 2)); process.exit(0); })()"
```

### Check Email Configuration:
```bash
node -e "const db = require('./backend/app/services/databaseService'); (async () => { const r = await db.executeQuery('SELECT CUSTOMER_ID, EMAIL_ADDRESS, IS_VERIFIED FROM JAVIER.CUSTOMER_EMAILS', []); console.log(JSON.stringify(r, null, 2)); process.exit(0); })()"
```

---

## 📝 Notes

- **Development Mode**: Verification codes appear in browser console (won't happen in production)
- **Email Service**: Currently in dev mode, no actual emails sent (codes in console)
- **Security**: All verification codes are hashed with bcrypt in database
- **Rate Limiting**: Public endpoints have rate limiting enabled
- **CSRF Protection**: Automatically handled by frontend

---

## 🎯 Success!

If both TEST_JAVIER and Diego 9900 can successfully reset their passwords and login, the forgot password flow is **100% working**!

You should see:
- ✅ Email configuration working
- ✅ Code generation working
- ✅ Code verification working
- ✅ Password update working
- ✅ Login with new password working

---

## 📞 Need Help?

If something doesn't work:
1. Check backend console for errors
2. Check browser console (F12) for errors
3. Run the debugging commands above
4. Check `FORGOT_PASSWORD_STATUS.md` for technical details

**Everything is ready - just follow the steps and test!** 🚀
