# Password Security Implementation

This document describes the password security features implemented in the User authentication system.

## Features Implemented

### 1. Password Strength Validation
All passwords must meet the following requirements:
- **Minimum 8 characters** in length
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one number** (0-9)
- **At least one special character** (!@#$%^&*()_+-=[]{};\'"\\|,.<>/?)

#### Validation Error Messages
If a password does not meet the requirements, the API returns a validation error response with specific error messages indicating what requirements are not met.

### 2. Password Hashing with bcrypt
All passwords are hashed using bcrypt with a salt factor of 10 before being stored in the database.
- Ensures passwords are never stored in plain text
- Uses industry-standard bcrypt algorithm
- Salt rounds: 10

### 3. Password History (Reuse Prevention)
To prevent users from reusing recent passwords:
- The system maintains a history of the last **5 passwords**
- When users change their password, the new password is compared against all passwords in the history
- Users **cannot reuse any of their last 5 passwords**
- Password history is stored with creation timestamps

#### Implementation Details
- New password must be different from current and last 5 historical passwords
- When a new password is set, the old password is added to the history
- The history is automatically trimmed to maintain only the 5 most recent passwords

### 4. Password Expiry (90 Days)
Passwords automatically expire after 90 days:
- When a user registers or changes their password, an expiry date is set 90 days in the future
- On login, the system checks if the password has expired
- If expired, login is blocked with a `passwordExpired: true` flag in the response
- Users are notified they must reset their password

### 5. Error Handling and Validation
All endpoints return comprehensive error information:
- Each response includes an `errors` array with specific validation messages
- Validation errors are categorized and returned with appropriate HTTP status codes
- Client applications can use these errors to provide specific feedback to users

## API Endpoints

### Register User
**POST** `/register`

Request body:
```json
{
  "fullName": "John Doe",
  "phone": "1234567890",
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "User Registered",
  "errors": []
}
```

Response (Validation Error):
```json
{
  "success": false,
  "message": "Password does not meet security requirements",
  "errors": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter"
  ]
}
```

### Login User
**POST** `/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Login Successful",
  "user": { ...user data },
  "token": "jwt_token",
  "errors": []
}
```

Response (Password Expired):
```json
{
  "success": false,
  "message": "Password has expired. Please reset your password.",
  "errors": ["Password expired"],
  "passwordExpired": true
}
```

### Update Profile
**PUT** `/update-profile`

Request headers:
```
Authorization: Bearer <jwt_token>
```

Request body (Password change requires current password):
```json
{
  "fullName": "Jane Doe",
  "password": "NewSecurePass456!",
  "currentPassword": "SecurePass123!"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Profile updated",
  "user": { ...user data without password },
  "errors": []
}
```

Response (Password Reuse Error):
```json
{
  "success": false,
  "message": "Cannot reuse any of your last 5 passwords",
  "errors": ["Password already used recently"]
}
```

### Reset Password
**POST** `/reset-password`

Request headers:
```
Authorization: Bearer <jwt_token>
```

Request body:
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Password reset successfully",
  "errors": []
}
```

Response (Validation Error):
```json
{
  "success": false,
  "message": "Password does not meet security requirements",
  "errors": [
    "Password must contain at least one special character (!@#$%^&*()_+-=[]{};\'"\\|,.<>/?)"
  ]
}
```

## Password Validation Utility

A new utility module `utils/passwordValidator.js` provides reusable password validation functions:

### `validatePasswordStrength(password)`
Validates a password against the security requirements.
- Returns: `{ valid: boolean, errors: string[] }`

### `checkPasswordHistory(newPassword, passwordHistory)`
Checks if a password has been used in the last 5 passwords.
- Returns: `boolean` (true if password reused)

### `isPasswordExpired(passwordExpiry)`
Checks if a password has expired.
- Returns: `boolean`

### `hashPasswordAndUpdateHistory(newPassword, currentHashedPassword, passwordHistory)`
Hashes a new password and updates password history.
- Returns: Object containing:
  - `hashedPassword`: The hashed password
  - `passwordHistory`: Updated history array
  - `passwordExpiry`: New expiry date (90 days from now)
  - `passwordChangedAt`: Timestamp of change
  - `isPasswordExpired`: Boolean flag

## Database Schema Updates

The User model has been extended with the following fields:

```javascript
passwordHistory: [{
  hashedPassword: String,
  createdAt: Date
}],
passwordExpiry: Date,
passwordChangedAt: Date,
isPasswordExpired: Boolean
```

## Best Practices

1. **Password Validation**: Always validate passwords on both client and server side
2. **HTTPS**: Always use HTTPS in production to protect passwords in transit
3. **Token Security**: Store JWT tokens securely on the client side
4. **Password Reset**: Encourage users to reset passwords when expiry is approaching
5. **Monitoring**: Log password change attempts for security auditing

## Testing Recommendations

When testing password functionality:

Valid password examples:
- `SecurePass123!`
- `MyPass@2024`
- `Admin#Password88`

Invalid password examples:
- `short` (too short, missing numbers/special chars)
- `alllowercase123!` (no uppercase)
- `ALLUPPERCASE123!` (no lowercase)
- `NoSpecial123` (no special character)
- `NoNumber!@#` (no numbers)
