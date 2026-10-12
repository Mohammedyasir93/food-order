# QuickBite

QuickBite is a college mini-project food ordering app built with React, Vite, and Express. It includes a full MongoDB/Mongoose backend and an optional JSON-file demo backend for running locally without MongoDB. Customers can register, browse and filter the menu, keep a persistent cart, place Cash on Delivery orders, and review their order history. Administrators can manage dishes and update fulfilment status.

## Architecture

```text
Browser (React + Vite, port 5173)
  ├── Auth context: JWT session and current user
  ├── Cart context: browser-persisted cart
  └── API client: Authorization: Bearer <token>
          │ HTTP / JSON
          ▼
Express REST API (port 5000)
  ├── Authentication, validation, rate limiting, role checks
  ├── Controllers and order price verification
  └── Mongoose models
          │
          ├── MongoDB (full backend)
          └── server/data/simple-store.json (local demo mode)
```

The browser sends only food IDs and quantities during checkout. The API retrieves current food records and creates order price snapshots from those trusted records. Admin permissions are enforced by Express middleware, not by hiding frontend controls.

## Run the Simple Backend Without MongoDB

This local demo mode uses Express and a git-ignored JSON data file. It supports registration/login, the sample menu, trusted-price checkout, order history, and admin endpoints. Data persists between restarts in `server/data/simple-store.json`. It is intended for local coursework demos; use the MongoDB backend for the full database setup.

In a VS Code terminal:

```powershell
cd server
npm.cmd run dev:simple
```

The client at `http://localhost:5173` will use this API on port 5000. The first run creates eight menu items automatically. To enable admin access, set these variables before starting the simple server:

```powershell
cd server
$env:ADMIN_NAME = 'QuickBite Admin'
$env:ADMIN_EMAIL = 'admin@example.com'
$securePassword = Read-Host 'Admin password (12+ characters)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
npm.cmd run dev:simple
```

The admin password is bcrypt-hashed. The simple server generates a temporary JWT secret when `JWT_SECRET` is not set, so users must sign in again after a restart. Set `JWT_SECRET` in `server\.env` to keep sessions valid across restarts. Stop the API with Ctrl+C. To use MongoDB instead, follow the setup below and run `npm.cmd run dev` from `server`.

## Requirements

- Node.js 20 or later (includes npm)
- MongoDB Community Server running locally, or a MongoDB Atlas database and connection string
- VS Code (recommended) and a browser

## Run in Windows PowerShell

Open the project folder in VS Code. Use separate integrated terminals for the API, admin setup, and Vite client.

### 1. Configure MongoDB and server secrets

For a local MongoDB installation, start the MongoDB Windows service from the Services app if it is not already running. The example URI uses `mongodb://127.0.0.1:27017/quickbite`. For Atlas, create a database user, allow your development IP, and replace `MONGODB_URI` with the Atlas connection string. URL-encode special characters in the database password.

From the project root:

```powershell
Copy-Item .env.example server\.env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Open `server\.env` in VS Code. Paste the generated random value as `JWT_SECRET`, check `MONGODB_URI`, and keep this file private. `.env` files are ignored by Git. The frontend uses `http://localhost:5000/api` by default; set `VITE_API_URL` in `client\.env.local` only if the API is hosted elsewhere.

### 2. Install dependencies

```powershell
cd server
npm.cmd install
cd ..\client
npm.cmd install
cd ..
```

### 3. Add the sample food menu

Make sure MongoDB is running, then:

```powershell
cd server
npm.cmd run seed
```

The seed script safely upserts ten sample menu items. Running it again updates those same items instead of duplicating them.

### 4. Create an administrator account

In a server terminal, set credentials for this PowerShell session only. Choose a unique email and a strong password of at least 12 characters; do not put real credentials in source files.

```powershell
cd server
$env:ADMIN_NAME = 'QuickBite Admin'
$env:ADMIN_EMAIL = 'admin@example.com'
$securePassword = Read-Host 'Admin password (12+ characters)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
npm.cmd run admin:create
$env:ADMIN_PASSWORD = $null
```

The setup script hashes the password with bcrypt and assigns the admin role. Registration from the website always creates a customer account.

### 5. Start the Express API

In the server terminal:

```powershell
cd server
npm.cmd run dev
```

The API listens on `http://localhost:5000`. Check `http://localhost:5000/api/health` for `{"status":"ok"}`.

### 6. Start Vite

Open another VS Code terminal:

```powershell
cd client
npm.cmd run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

### 7. Try the app

Register a customer account, browse or search the menu, add food to the cart, sign in, and place a Cash on Delivery order. Review it at **My orders**. Sign out and sign in using the admin email/password to open **Admin**, edit availability or prices, and change an order status. Admin dashboard sales exclude cancelled orders.

## API reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create a customer account |
| POST | `/auth/login` | Public | Sign in and receive a JWT |
| GET | `/auth/me` | Signed in | Get the current account |
| GET | `/foods?search=&category=&sort=` | Public | Search and filter menu items |
| GET | `/foods/:id` | Public | Get one food item |
| POST | `/foods` | Admin | Add a food item |
| PUT | `/foods/:id` | Admin | Edit a food item or availability |
| DELETE | `/foods/:id` | Admin | Delete a food item |
| POST | `/orders` | Signed in | Create a server-priced COD order |
| GET | `/orders/my-orders` | Signed in | List the current user's orders |
| GET | `/orders/:id` | Order owner | Read one of the current user's orders |
| GET | `/admin/dashboard` | Admin | Read order, sales, menu, and customer totals |
| GET | `/admin/orders` | Admin | List customer orders for fulfilment |
| PATCH | `/admin/orders/:id/status` | Admin | Update an order status |

Protected requests use `Authorization: Bearer <token>`. Import `postman/QuickBite.postman_collection.json` into Postman for ready-to-run request examples. Run Register or Login first, then a food-list request, then Create order. Use the created admin account for the `/admin` requests.

### Example requests

Register:

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{"name":"Aanya Sharma","email":"aanya@example.com","password":"tasteful-demo-123"}
```

Create order (the `foodId` comes from `GET /foods`):

```http
POST http://localhost:5000/api/orders
Authorization: Bearer <customer-token>
Content-Type: application/json

{"customerName":"Aanya Sharma","phoneNumber":"+91 98765 43210","deliveryAddress":"12 Lake Road, Bengaluru 560001","instructions":"Call on arrival","items":[{"foodId":"<food-id>","quantity":2}]}
```

Admin status update:

```http
PATCH http://localhost:5000/api/admin/orders/<order-id>/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{"status":"Preparing"}
```

## Project map

```text
client/                         React + Vite frontend
  src/components/               Navigation, food cards, notifications
  src/context/                  Authentication and cart state
  src/pages/                    Home, auth, cart, checkout, orders, admin
  src/services/api.js           Shared fetch client
server/                         Express + Mongoose API
  config/                       MongoDB connection
  controllers/                  Auth, food, order, admin logic
  middleware/                   Auth, validation, errors, async wrapper
  models/                       User, Food, Order schemas and indexes
  routes/                       REST route definitions
  scripts/                      Food seeding and admin bootstrap
  test/                         Database-independent order pricing tests
postman/                        Importable API collection
```

## Tests and production build

From the project root:

```powershell
npm.cmd --prefix server test
npm.cmd --prefix client run build
```

The backend pricing tests run without MongoDB. The app's registration, database persistence, and full browser checkout require a reachable MongoDB instance and are not replaced by those unit tests.

## Notes and limitations

- Cash on Delivery is the only payment option. No payment gateway, SMS, email, or live delivery tracking is configured.
- Delivery is included in the displayed total for this demo; no delivery-fee rules are configured.
- Food photos use remote Unsplash image URLs and require internet access. A fallback image is shown if a URL fails.
- The demo client stores the JWT in browser `localStorage` to persist sign-in across reloads. For a public production deployment, use HTTPS and an appropriately configured `HttpOnly`, `Secure`, `SameSite` cookie design, plus CSRF protections.
- Set `CLIENT_ORIGIN` to the exact deployed frontend origin before deploying the API. Never use the example JWT secret in production.

## Troubleshooting

- **MongoDB connection refused:** start the MongoDB service, check the URI and port, or verify Atlas network access and database credentials.
- **JWT secret error:** ensure `server\.env` exists and `JWT_SECRET` has at least 32 characters.
- **Menu is empty:** run `npm.cmd run seed` from `server` after MongoDB is available.
- **Admin page is missing or forbidden:** sign in with the account created by `npm.cmd run admin:create`; ordinary registrations are customers.
- **CORS error:** set `CLIENT_ORIGIN=http://localhost:5173` in `server\.env`, restart the API, and use the matching Vite origin.
- **PowerShell blocks `npm.ps1`:** use `npm.cmd` in place of `npm` for that terminal session.
- **API port already in use:** set a different `PORT` in `server\.env`, then set `VITE_API_URL` in `client\.env.local` to match.