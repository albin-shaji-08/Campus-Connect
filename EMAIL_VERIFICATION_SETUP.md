## 🔧 Email Service Configuration

### Step 1: Update .env File

Open `backend/.env` and replace these placeholder values:

```properties
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password-goes-here
```

### Step 2: Generate Gmail App Password

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification" and follow the setup

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "CampusConnect"
   - Copy the 16-character password (no spaces)
   - Paste it in EMAIL_PASSWORD in your .env file

### Step 3: Start MongoDB

Make sure MongoDB is running:

```powershell
# MongoDB should be running on localhost:27017
Get-Process mongod  # Check if running
```

### Step 4: Start Application

```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🧪 Testing the Feature

### Test Flow:

1. **Register** a new user at http://localhost:3000/register
   - Fill in all details
   - Click "Register"
   - You should see: "Registration successful! Please check your email..."

2. **Check Email**
   - Open your Gmail inbox
   - Find email from CampusConnect
   - Click "Verify Email Address" button

3. **Verify Email**
   - You'll be redirected to verification page
   - Should see success message
   - Automatically redirected to login

4. **Try Login Without Verification** (optional test)
   - Try logging in before verifying
   - Should see error: "Please verify your email..."
   - "Resend Verification Email" button appears
   - Click to resend if needed

5. **Login After Verification**
   - Should work normally
   - Welcome to CampusConnect!

## 📋 Email Verification Workflow

```
User Registers
    ↓
Backend creates user (isEmailVerified: false)
    ↓
Backend sends verification email
    ↓
User receives email with token link
    ↓
User clicks link → /verify-email?token=xxx
    ↓
Backend verifies token and updates user
    ↓
User redirected to login
    ↓
User can now login successfully
```

## 🛠️ Troubleshooting

### Email Not Sending?

- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Make sure 2FA is enabled on Gmail
- Use App Password, not regular password
- Check backend console for error messages

### Token Expired?

- Tokens expire after 24 hours
- Use "Resend Verification Email" button on login page

### Email Goes to Spam?

- Check spam/junk folder
- Mark as "Not Spam" to improve delivery

### Can't Login?

- Make sure you verified your email first
- Check for error message on login page
- Try resending verification email

## 🔒 Security Note

- ✓ Tokens expire after 24 hours
- ✓ One-time use tokens
- ✓ Email verification required before login
- ✓ Secure token generation (crypto.randomBytes)
- ✓ Email sent via secure SMTP

## 📝 Notes

- Admin logins don't require email verification
- Only student/organizer registrations need verification
