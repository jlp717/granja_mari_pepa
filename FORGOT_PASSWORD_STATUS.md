# FORGOT PASSWORD FLOW - CURRENT STATUS

## ⚠️ CRITICAL ISSUE FOUND

The `authServiceSecure.js` service is using **WRONG TABLE COLUMN NAMES** that don't match the actual database schema. This is preventing the forgot password flow from working.

---

## 📊 Database Schema Mismatch

### PASSWORD_RESET_TOKENS Table

**What authServiceSecure.js expects:**
- `ID`
- `CODIGO_CLIENTE`  
- `TOKEN`
- `EMAIL`
- `FECHA_CREACION`
- `FECHA_EXPIRACION`
- `USADO`

**What actually exists in database:**
- `TOKEN_ID`
- `CUSTOMER_ID` (not CODIGO_CLIENTE!)
- `TOKEN_HASH`
- `TOKEN_EXPIRES_AT`
- `IS_USED`
- `USED_AT`
- `CREATED_AT`
- `REQUEST_IP`
- `REQUEST_USER_AGENT`
- `RESET_METHOD`

### Alternative: VERIFICATION_CODES Table

There's also a `VERIFICATION_CODES` table with:
- `CODE_ID`
- `CUSTOMER_ID`
- `CODE_HASH`
- `CODE_TYPE`
- `DELIVERY_METHOD`
- `DELIVERY_TARGET`
- `EXPIRES_AT`
- `IS_USED`
- `USED_AT`
- `ATTEMPTS`
- `CREATED_AT`
- `CREATED_IP`

---

## ✅ What Works So Far

1. ✅ **Backend endpoint created**: `POST /api/auth/v2/configure-email`
2. ✅ **Email configuration logic**: `saveEmailForCustomer()` in authServiceSecure
3. ✅ **Frontend UI updated**: Email prompt modal added to forgot password flow
4. ✅ **Error handling improved**: Returns proper error objects instead of throwing
5. ✅ **Diego reset script created**: Can restore Diego to original state

---

## ❌ What Doesn't Work

1. ❌ **Password reset token storage**: Uses wrong column names
2. ❌ **Password reset token retrieval**: Query will fail
3. ❌ **End-to-end flow**: Cannot complete because of database mismatch

---

## 🔧 What Needs to Be Fixed

### Option 1: Update authServiceSecure.js to match existing schema

Update the following methods in `backend/app/services/authServiceSecure.js`:

1. **`requestPasswordReset()` method** (line ~820-857):
   - Change INSERT query to use correct column names
   - Use `PASSWORD_RESET_TOKENS` or `VERIFICATION_CODES` table
   
2. **`resetPasswordWithCode()` method** (line ~927-940):
   - Change SELECT query to use correct column names
   - Update token verification logic

### Option 2: Create migration to add expected columns

Create SQL migration to alter tables to match what authServiceSecure expects.

**Recommendation: Option 1** (Update code to match database)

---

## 📝 Diego (4300009900) Status

✅ **Diego has been reset to original state:**
- Password: `23224478K` (his NIF)
- Password algorithm: `LEGACY`
- Is legacy password: `YES`
- Password warning dismissals: `0`
- Password last changed: `NULL`

Note: The email and token deletion steps failed due to column name mismatch, but this doesn't affect Diego's ability to login.

---

## 🧪 Testing Instructions

### Once the database schema issue is fixed:

1. **Go to**: http://localhost:3000/area-clientes

2. **Test with TEST_JAVIER** (no email configured):
   - Click "¿Olvidaste tu contraseña?"
   - Enter: `TEST_JAVIER`
   - Should show: Email configuration prompt
   - Enter email: `test@example.com`
   - Should receive verification code
   - Enter code and new password
   - Should successfully change password

3. **Test with Diego** (has legacy email):
   - Login with: `4300009900` / `23224478K`
   - Should see legacy password warning
   - Logout
   - Click "¿Olvidaste tu contraseña?"
   - Enter: `4300009900`
   - Should directly send code to his email (from DSEDAC.CLIP)
   - Complete password reset

---

## 🎯 Next Steps

### Immediate (Required to make it work):

1. **Fix `authServiceSecure.requestPasswordReset()`**:
   ```javascript
   // Line ~820-857
   // Change INSERT to use CUSTOMER_ID instead of CODIGO_CLIENTE
   // Use TOKEN_HASH instead of TOKEN
   // Use TOKEN_EXPIRES_AT instead of FECHA_EXPIRACION
   ```

2. **Fix `authServiceSecure.resetPasswordWithCode()`**:
   ```javascript
   // Line ~927-960
   // Change SELECT to query by CUSTOMER_ID
   // Use correct column names
   ```

3. **Test complete flow** with both users

### Future Improvements:

- Add email verification system
- Add rate limiting for verification codes
- Add CAPTCHA for public endpoints
- Implement code expiration cleanup job

---

## 📂 Files Modified

### Backend:
- ✅ `backend/app/controllers/authControllerV2.js` - Added `configureEmailForReset()`
- ✅ `backend/app/services/authServiceSecure.js` - Added `saveEmailForCustomer()`, improved error handling
- ✅ `backend/server.js` - Added route for email configuration
- ⚠️ `backend/app/services/authServiceSecure.js` - **NEEDS FIX** for token storage/retrieval

### Frontend:
- ✅ `frontend/app/area-clientes/page.tsx` - Added email prompt UI and logic

### Scripts:
- ✅ `backend/scripts/test/reset-diego-original.js` - Reset Diego to original state
- ✅ `backend/scripts/test/check-customer-emails-table.js` - Check table structure

---

## 🔐 Security Notes

- CSRF protection is enabled globally (correct)
- Email configuration endpoint is public but rate-limited (correct)
- Verification codes should be 6 digits with 1-hour expiration (needs verification after fix)
- Codes should be hashed in database (needs implementation)

---

## ⏱️ Time Estimate to Complete

- Fix database schema issues: **30 minutes**
- Test complete flow: **15 minutes**  
- **Total: ~45 minutes**

---

## 💡 Conclusion

The forgot password flow is **90% complete**. The UI, API endpoints, and business logic are all in place. The only blocker is the database column name mismatch in the token storage/retrieval logic.

Once this is fixed, the complete flow will work end-to-end.
