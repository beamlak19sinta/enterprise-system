# 🚀 MongoDB Atlas Setup Checklist

## ✅ Quick Setup Steps

### 1. Create MongoDB Atlas Account
- [ ] Go to: https://www.mongodb.com/cloud/atlas/register
- [ ] Sign up (FREE account)
- [ ] Verify email

### 2. Create FREE Cluster (M0)
- [ ] Click "Build a Database"
- [ ] Select **M0 FREE** tier (512 MB)
- [ ] Choose region (closest to you)
- [ ] Click "Create" (wait 1-3 minutes)

### 3. Create Database User
- [ ] Username: `erp_admin`
- [ ] Password: **SAVE THIS PASSWORD** (autogenerate recommended)
- [ ] Click "Create User"

### 4. Setup Network Access
- [ ] Click "Add My Current IP Address"
- [ ] OR "Allow Access from Anywhere" (0.0.0.0/0) for testing
- [ ] Click "Finish and Close"

### 5. Get Connection String
- [ ] Click "Connect" on your cluster
- [ ] Choose "Connect your application"
- [ ] Driver: Node.js
- [ ] Copy connection string (looks like):
  ```
  mongodb+srv://erp_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```

### 6. Update Backend Configuration
- [ ] Open `backend\.env` file
- [ ] Find the `MONGODB_URI` line
- [ ] Replace with your Atlas connection string
- [ ] Replace `<password>` with your actual password
- [ ] Add `/erp_system` before the `?` in the URL

**Example:**
```env
MONGODB_URI=mongodb+srv://erp_admin:MyP@ssw0rd@cluster0.abc123.mongodb.net/erp_system?retryWrites=true&w=majority
```

### 7. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Seed Database (first time only):**
```bash
cd backend
npm run seed
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 8. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

### 9. Login with Demo Account
- Email: `admin@erpsystem.com`
- Password: `Admin@123456`

---

## 🔧 Troubleshooting

### Connection Error: "Could not connect to MongoDB"
- Check your connection string is correct
- Ensure password has no special characters (or URL encode them)
- Verify IP address is whitelisted in Atlas
- Check internet connection

### Special Characters in Password
If your password has special characters, URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `^` → `%5E`
- `&` → `%26`

Or regenerate a simpler password in Atlas.

### Can't Access MongoDB Atlas
- Ensure you're logged into https://cloud.mongodb.com
- Check email for verification link
- Try different browser if issues persist

---

## 📞 Need Help?

1. **MongoDB Atlas Documentation:** https://www.mongodb.com/docs/atlas/
2. **Connection String Format:** https://www.mongodb.com/docs/manual/reference/connection-string/
3. **Atlas Free Tier:** https://www.mongodb.com/pricing

---

**Status:** Once MongoDB Atlas is configured, your ERP system will be fully operational! 🎉
