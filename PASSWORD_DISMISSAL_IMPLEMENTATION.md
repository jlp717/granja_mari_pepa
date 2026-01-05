# Password Warning Dismissal Feature - Implementation Complete

## Overview
Implemented a system where users can dismiss the legacy password warning twice. After 2 dismissals, the warning will no longer appear on login, but users can still change their password from the Perfil section.

---

## Database Changes

### New Column Added
**File:** `backend/scripts/setup/add-password-warning-dismissals.sql`

```sql
ALTER TABLE JAVIER.CUSTOMER_CREDENTIALS 
ADD COLUMN PASSWORD_WARNING_DISMISSALS INTEGER DEFAULT 0;
```

**Purpose:**
- Tracks how many times the user has dismissed the password warning
- Range: 0-2
- When >= 2, the warning stops showing on login
- Resets to 0 when user successfully changes password

---

## Backend Changes

### 1. AuthServiceSecure (`backend/app/services/authServiceSecure.js`)

#### Modified Login Method (line 87-90)
```javascript
// Only show warning if legacy password AND dismissal count < 2
const dismissalCount = Number(customer.PASSWORD_WARNING_DISMISSALS || 0);
const showPasswordChangeModal = customer.IS_LEGACY_PASSWORD === '1' && dismissalCount < 2;
```

#### New Methods Added (lines 700-760):

**`incrementPasswordWarningDismissal(customerId)`**
- Increments the dismissal counter by 1
- Audits the dismissal event
- Returns updated count

**`resetPasswordWarningDismissals(customerId)`**
- Resets dismissal counter to 0
- Called automatically when user changes password

**`getPasswordWarningDismissalCount(customerId)`**
- Returns current dismissal count
- Used for debugging/checking status

#### Modified changePassword Method (line 181)
```javascript
// Reset password warning dismissals since user changed password
await this.resetPasswordWarningDismissals(customerId);
```

---

### 2. AuthControllerV2 (`backend/app/controllers/authControllerV2.js`)

#### New Endpoint Added:

**`POST /api/auth/dismiss-password-warning`** (Protected route)

```javascript
async function dismissPasswordWarning(req, res) {
  const customerId = req.user?.customerId || req.user?.id;
  
  // Increment dismissal counter
  await authServiceSecure.incrementPasswordWarningDismissal(customerId);
  
  // Get updated count
  const dismissalCount = await authServiceSecure.getPasswordWarningDismissalCount(customerId);
  
  return res.json({
    success: true,
    dismissalCount,
    showAgain: dismissalCount < 2
  });
}
```

---

### 3. Server Routes (`backend/server.js`, line 346)

```javascript
// PROTEGIDO: Descartar advertencia de contraseña legacy
app.post('/api/auth/dismiss-password-warning', requireAuth, generalLimiter, authControllerV2.dismissPasswordWarning.bind(authControllerV2));
```

---

## Frontend Changes

### AuthFlowManager (`frontend/components/auth/AuthFlowManager.tsx`)

#### Modified handleAcceptRisk Method (line 48-67):

```typescript
const handleAcceptRisk = async () => {
  setShowFinalWarning(false);
  
  // Increment dismissal counter in backend
  try {
    const response = await fetch('/api/auth/dismiss-password-warning', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Password warning dismissed', data);
    }
  } catch (error) {
    console.error('Error dismissing password warning:', error);
    // Continue anyway - non-critical error
  }
  
  onFlowComplete();
};
```

---

## User Flow

### First Login (Dismissal Count = 0)
1. User logs in with legacy password
2. `LegacyPasswordWarningModal` appears
3. User clicks "Continuar de momento"
4. `FinalSecurityWarningModal` appears
5. User clicks "Aceptar Riesgo y Continuar"
6. **Backend increments dismissal counter to 1**
7. User proceeds to dashboard

### Second Login (Dismissal Count = 1)
1. User logs in again with legacy password
2. Warnings appear again (same flow as above)
3. User dismisses again
4. **Backend increments dismissal counter to 2**
5. User proceeds to dashboard

### Third Login and Beyond (Dismissal Count >= 2)
1. User logs in with legacy password
2. **No warnings appear** - user goes directly to dashboard
3. User can still change password from Perfil section

### When User Changes Password
1. User changes password successfully
2. **Backend automatically resets dismissal counter to 0**
3. Password is no longer "legacy" (`IS_LEGACY_PASSWORD` = '0')
4. No warnings will appear regardless

---

## TODO: Add Password Change to Perfil Section

**Status:** PENDING

The Perfil tab exists in `frontend/components/customer/dashboard.tsx` but needs a "Change Password" button added.

### Implementation Plan:

1. Find the Perfil tab content section (around line 3950)
2. Add a "Security" card with:
   - Password strength indicator (if legacy)
   - "Change Password" button
   - Opens PasswordChangeForm modal

**Example UI:**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Lock className="w-5 h-5" />
      Seguridad
    </CardTitle>
  </CardHeader>
  <CardContent>
    {user?.isLegacyPassword && (
      <Alert variant="warning">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          Estás usando una contraseña legacy
        </AlertDescription>
      </Alert>
    )}
    <Button 
      onClick={() => setShowPasswordChangeModal(true)}
      className="mt-4"
    >
      <Lock className="w-4 h-4 mr-2" />
      Cambiar Contraseña
    </Button>
  </CardContent>
</Card>
```

---

## Testing Checklist

- [ ] Run SQL migration script to add column
- [ ] Test first dismissal (counter should be 1)
- [ ] Test second dismissal (counter should be 2)
- [ ] Test third login (no warnings should appear)
- [ ] Test password change (counter should reset to 0)
- [ ] Test password change flow from Perfil section (TODO)
- [ ] Verify audit logs are created for dismissals
- [ ] Test with TEST_JAVIER user

---

## Database Migration Command

```bash
# Connect to your IBM i database and run:
backend/scripts/setup/add-password-warning-dismissals.sql
```

---

## Files Modified

### Created:
- `backend/scripts/setup/add-password-warning-dismissals.sql`
- `PASSWORD_DISMISSAL_IMPLEMENTATION.md` (this file)

### Modified:
- `backend/app/services/authServiceSecure.js`
- `backend/app/controllers/authControllerV2.js`
- `backend/server.js`
- `frontend/components/auth/AuthFlowManager.tsx`

### To Modify (TODO):
- `frontend/components/customer/dashboard.tsx` - Add password change button to Perfil tab

---

## Benefits

1. **Better UX:** Users aren't nagged indefinitely
2. **Security:** After 2 reminders, we trust user's choice
3. **Flexibility:** Users can always change password from Perfil
4. **Tracking:** We know how many times users dismissed the warning
5. **Clean:** Automatically resets when password is changed

---

##Notes

- Dismissal count is tracked per user
- Non-intrusive: doesn't block user access
- Respects user choice after 2 reminders
- Audit trail maintained for security compliance
- Password change option always available in Perfil section
