# Password Security Quick Reference

## Password Requirements
```
✓ Minimum 8 characters
✓ At least 1 UPPERCASE letter (A-Z)
✓ At least 1 lowercase letter (a-z)
✓ At least 1 number (0-9)
✓ At least 1 special character (!@#$%^&*()_+-=[]{};\'"\\|,.<>/?)
```

## Valid Password Examples
- `SecurePass123!`
- `MyPassword@2024`
- `Admin#Pass456`
- `User$Secure789`

## Invalid Password Examples
- `short` - Too short, missing requirements
- `alllowercase123!` - No uppercase
- `ALLUPPERCASE123!` - No lowercase
- `NoSpecial123` - No special character
- `NoNumber!@#` - No numbers

## Key Features
| Feature | Details |
|---------|---------|
| **Hashing** | bcrypt with salt factor 10 |
| **History** | Last 5 passwords tracked |
| **Expiry** | 90 days from creation/change |
| **Reuse Prevention** | Cannot use any of last 5 passwords |
| **Validation** | Returns specific error messages |

## API Endpoints

### 1. Register User
```
POST /register
Content-Type: application/json

{
  "fullName": "John Doe",
  "phone": "1234567890",
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:** `201`
```json
{
  "success": true,
  "message": "User Registered",
  "errors": []
}
```

**Error Response:** `400`
```json
{
  "success": false,
  "message": "Password does not meet security requirements",
  "errors": [
    "Password must be at least 8 characters long",
    "Password must contain at least one special character..."
  ]
}
```

---

### 2. Login User
```
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:** `200`
```json
{
  "success": true,
  "message": "Login Successful",
  "user": { ...user data },
  "token": "eyJhbGc...",
  "errors": []
}
```

**Password Expired Response:** `403`
```json
{
  "success": false,
  "message": "Password has expired. Please reset your password.",
  "errors": ["Password expired"],
  "passwordExpired": true
}
```

---

### 3. Update Profile (with password change)
```
PUT /update-profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "password": "NewSecurePass456!",
  "currentPassword": "SecurePass123!"
}
```

**Success Response:** `200`
```json
{
  "success": true,
  "message": "Profile updated",
  "user": { ...user data without password },
  "errors": []
}
```

**Password Reuse Error:** `400`
```json
{
  "success": false,
  "message": "Cannot reuse any of your last 5 passwords",
  "errors": ["Password already used recently"]
}
```

---

### 4. Reset Password
```
POST /reset-password
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Success Response:** `200`
```json
{
  "success": true,
  "message": "Password reset successfully",
  "errors": []
}
```

---

## Error Codes

| Code | Scenario |
|------|----------|
| `400` | Missing fields, invalid password format, password reuse |
| `401` | Missing or invalid token |
| `403` | Wrong password, password expired, invalid credentials |
| `404` | User not found |
| `500` | Server error |

## Common Error Messages

| Error | Fix |
|-------|-----|
| "Password must be at least 8 characters long" | Use ≥8 characters |
| "Password must contain at least one uppercase letter" | Add A-Z |
| "Password must contain at least one lowercase letter" | Add a-z |
| "Password must contain at least one number" | Add 0-9 |
| "Password must contain at least one special character" | Add !@#$%... |
| "Cannot reuse any of your last 5 passwords" | Choose a new unique password |
| "Password has expired. Please reset your password." | Use reset password endpoint |
| "Current password is incorrect" | Verify current password |

## Files Modified
- ✅ `models/User.js` - Added password security fields
- ✅ `controllers/UserController.js` - Updated all auth endpoints
- ✅ `utils/passwordValidator.js` - NEW validation utility

## Testing Checklist
- [ ] Test registration with weak password
- [ ] Test registration with strong password
- [ ] Test login after password expires (wait 90 days or modify DB)
- [ ] Test password update with same password
- [ ] Test password update with reused password
- [ ] Test password reset endpoint
- [ ] Test all validation error messages
