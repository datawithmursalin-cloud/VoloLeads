# Getting Started with Your Backend

## Immediate Steps

### 1. Enter Backend Directory
```bash
cd backend
```

### 2. Run Setup (Installs dependencies)
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test the API
Open your browser: http://localhost:5000

Or use curl:
```bash
curl http://localhost:5000/api/health
```

## First API Call - Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your@example.com",
    "password": "password123"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": { "id": "...", "name": "Your Name", "email": "..." },
  "token": "eyJhbGc..."
}
```

## File Structure Overview

```
backend/
├── src/                    # Your application code
│   ├── server.js          # Main app
│   ├── routes/            # API endpoints
│   ├── models/            # Database schemas
│   └── middleware/        # Auth & validation
├── public/                # Static files
├── .env                   # Your config (Git ignored)
├── .env.example           # Config template
└── package.json           # Dependencies
```

## Key Commands

```bash
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Check code quality
npm run lint

# Fix code style issues
npm run lint:fix
```

## Configuration

Before deploying, update `.env`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
```

## Extending the API

### Add New Route
Create `src/routes/items.js`:
```javascript
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ items: [] });
});

module.exports = router;
```

Add to `src/server.js`:
```javascript
app.use('/api/items', require('./routes/items'));
```

## Deployment to cPanel

See `CPANEL_DEPLOYMENT.md` for complete instructions, or quick summary:

1. Upload files via FTP/SSH
2. Run `npm install`
3. Configure `.env`
4. Use cPanel Node.js Manager or Passenger
5. Point domain to app
6. Done! ✅

## Documentation

- **API_DOCUMENTATION.md** - Complete API reference
- **CPANEL_DEPLOYMENT.md** - Deployment guide
- **PROJECT_STRUCTURE.md** - Project layout
- **MONITORING_GUIDE.md** - Production monitoring
- **README.md** - Project overview

## What's Working Now

✅ Health check endpoint
✅ User registration
✅ User login
✅ JWT authentication
✅ User profile retrieval
✅ Error handling
✅ Request logging
✅ CORS & security headers

## Common First Steps

1. **Database Setup** (optional)
   - Install MongoDB locally or use MongoDB Atlas
   - Update `DATABASE_URL` in .env
   - Uncomment MongoDB connection in `src/server.js`

2. **Add Your First Feature**
   - Create route in `src/routes/yourfeature.js`
   - Add to `src/server.js`
   - Test with curl

3. **Connect Frontend**
   - Update `CORS_ORIGIN` in .env to frontend URL
   - Frontend can now call `/api/health` and other endpoints

## Need Help?

- Check logs: `npm run dev` shows errors in terminal
- Read CPANEL_DEPLOYMENT.md troubleshooting section
- Verify Node.js: `node -v` (should be 16+)
- Check dependencies: `npm list`

## Ready for Production?

See deployment checklist in SETUP_COMPLETE.md

Happy coding! 🚀
