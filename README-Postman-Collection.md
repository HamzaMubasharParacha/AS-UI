# Anti-Drone System - Postman Collections

This repository contains multiple Postman collections for testing the Anti-Drone System web application hosted at `https://192.168.100.100/dashboard`.

## 📁 Files Included

### 🎯 Collections (Choose Based on Your Needs)

1. **`Anti-Drone-System-Working-API.postman_collection.json`** - ⭐ **RECOMMENDED START HERE**
   - Contains only verified working endpoints
   - Includes endpoint discovery tools
   - Best for finding actual API endpoints on your system

2. **`Anti-Drone-System-API.postman_collection.json`** - Comprehensive theoretical collection
   - 25+ endpoints across 8 categories
   - Based on frontend component analysis
   - Many endpoints may not exist on your actual system

3. **`Anti-Drone-System-Frontend-Testing.postman_collection.json`** - Frontend testing
   - Tests frontend routes and static assets
   - Helps distinguish between API and frontend routing

### 🔧 Configuration
- **`Anti-Drone-System.postman_environment.json`** - Environment variables for all collections
- **`README-Postman-Collection.md`** - This documentation file

## 🚀 Quick Start

### Option 1: Start with Working API Collection (⭐ RECOMMENDED)

1. **Import the Working Collection First**
   ```
   File: Anti-Drone-System-Working-API.postman_collection.json
   ```
   - Open Postman → Click **Import** → Select the file
   - This collection contains only verified working endpoints

2. **Test the Confirmed Working Login**
   - Navigate to **"✅ Working Endpoints"** → **"Login (VERIFIED)"**
   - Click **Send** - this endpoint is confirmed to work with your system
   - Check the **Console** tab for detailed response analysis

3. **Discover Other Working Endpoints**
   - Use the **"🔍 Endpoint Discovery"** folder
   - Run requests systematically to find other working API endpoints
   - Check console logs for detailed analysis of each endpoint

### Option 2: Use Comprehensive Collection

1. **Import Main Collection and Environment**
   - `Anti-Drone-System-API.postman_collection.json`
   - `Anti-Drone-System.postman_environment.json`
   - Select **"Anti-Drone System Environment"** from dropdown

2. **Configure Base URL**
   - Pre-configured for: `https://192.168.100.100`
   - Update `base_url` environment variable if different

3. **Start with Authentication**
   - Use `Authentication > Login` request first
   - Default credentials: `admin` / `admin123`
   - **Note**: Most other endpoints are theoretical and may not exist

### Option 3: Frontend Testing

1. **Import Frontend Collection**
   ```
   File: Anti-Drone-System-Frontend-Testing.postman_collection.json
   ```
   - Tests frontend routes and static assets
   - Helps identify what's frontend vs API

## 📋 Collection Structure

### 🔐 Authentication
- **Login** - Authenticate and get access token
- **Logout** - Invalidate current session
- **Refresh Token** - Renew access token
- **Get User Profile** - Retrieve user information

### 🛩️ Drone Detection & Tracking
- **Get All Detected Drones** - List all drones with filtering options
- **Get Drone by ID** - Detailed drone information
- **Get Real-time Updates** - Live drone position updates
- **Update Threat Level** - Modify drone threat classification
- **Get Tracking History** - Historical drone movement data

### 🖥️ System Status & Monitoring
- **Get System Status** - Overall system health
- **Get Radar Status** - Radar system details
- **Toggle Radar System** - Enable/disable radar
- **Get System Health** - Diagnostic information
- **Get System Logs** - System log entries with filtering

### 🛡️ Countermeasure Controls
- **Get Available Countermeasures** - List countermeasure systems
- **Deploy RF Jammer** - Activate RF jamming against target
- **Deploy Laser System** - Activate laser countermeasures
- **Deploy Net Launcher** - Physical capture system
- **Stop Countermeasure** - Halt active countermeasures

### 🗺️ Map & Drawing Tools
- **Get Map Configuration** - Map settings and coordinates
- **Save Drawing Shape** - Store drawn polygons/shapes
- **Get All Map Shapes** - Retrieve saved map annotations

### 📊 Data Visualization & Analytics
- **Get Threat Statistics** - Threat level distribution data
- **Get Detection Timeline** - Time-series detection data
- **Get Distance Distribution** - Drone distance analytics

### 🔌 WebSocket & Real-time
- **WebSocket Connection Info** - Real-time connection details

### 🎛️ Dashboard & UI
- **Get Dashboard** - Access main interface
- **Get Static Assets** - Frontend resources

## 🔧 Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `base_url` | API base URL | `https://192.168.100.100` |
| `access_token` | JWT access token | (auto-set after login) |
| `refresh_token` | JWT refresh token | (auto-set after login) |
| `drone_id` | Sample drone ID | `DRONE_001` |
| `countermeasure_id` | Active countermeasure ID | (set by responses) |
| `shape_id` | Map shape ID | (set by responses) |
| `timestamp` | Current timestamp | (auto-generated) |
| `start_time` | Query start time | (auto-generated) |
| `end_time` | Query end time | (auto-generated) |
| `operator_id` | Operator identifier | `operator_001` |
| `command_center_lat` | Command center latitude | `33.6375773` |
| `command_center_lng` | Command center longitude | `72.9877674` |
| `radar_range` | Radar detection range (m) | `10000` |

## 🧪 Testing Features

### Automated Tests
The collection includes automated tests that:
- Verify response status codes
- Check response times (< 5000ms)
- Validate response structure
- Handle authentication errors
- Auto-extract IDs for subsequent requests

### Pre-request Scripts
- Auto-generate timestamps for time-based queries
- Set up date ranges for analytics requests
- Prepare dynamic variables

## 📝 Usage Examples

### Basic Workflow

1. **Authenticate**
   ```
   POST /api/auth/login
   ```

2. **Get System Status**
   ```
   GET /api/system/status
   ```

3. **List Detected Drones**
   ```
   GET /api/drones?limit=50&threat_level=all
   ```

4. **Deploy Countermeasure** (if threats detected)
   ```
   POST /api/countermeasures/rf-jammer/deploy
   ```

### Advanced Analytics

1. **Get Threat Statistics**
   ```
   GET /api/analytics/threats?period=24h&group_by=threat_level
   ```

2. **Get Detection Timeline**
   ```
   GET /api/analytics/timeline?from={{start_time}}&to={{end_time}}
   ```

## 🔍 API Endpoint Categories

### Core Functionality
- **Authentication**: JWT-based security
- **Drone Management**: Detection, tracking, classification
- **System Control**: Radar, countermeasures, monitoring
- **Real-time Data**: WebSocket connections, live updates

### Data & Analytics
- **Historical Data**: Tracking history, system logs
- **Statistics**: Threat distribution, detection patterns
- **Visualization**: Charts, timelines, maps

### User Interface
- **Dashboard Access**: Main application interface
- **Map Tools**: Drawing, annotations, zones
- **Configuration**: System settings, preferences

## 🛠️ Customization

### Adding New Endpoints
1. Create new request in appropriate folder
2. Use existing authentication headers
3. Add relevant tests and documentation
4. Update environment variables if needed

### Modifying Base URL
Update the `base_url` environment variable to point to your system:
```json
{
  "key": "base_url",
  "value": "https://your-system-ip-or-domain",
  "type": "default"
}
```

## 🔒 Security Notes

- **HTTPS Required**: All endpoints use HTTPS
- **JWT Authentication**: Bearer token required for most endpoints
- **Token Refresh**: Automatic token renewal available
- **Authorization Codes**: Countermeasures require special authorization

## 📞 Support

For issues with the API collection:
1. Verify your system is accessible at the configured URL
2. Check authentication credentials
3. Ensure all environment variables are set correctly
4. Review the test results for specific error details

## 🎯 Expected Response Formats

### Successful Authentication
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "user_001",
    "username": "admin",
    "role": "operator"
  }
}
```

### Drone Detection Response
```json
{
  "drones": [
    {
      "id": "DRONE_001",
      "position": [72.9977674, 33.6475773, 150],
      "threat_level": "HIGH",
      "distance": 1100,
      "speed": 25,
      "heading": 45,
      "detected_at": "2025-01-27T06:41:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

### System Status Response
```json
{
  "radar": "ONLINE",
  "countermeasures": "READY",
  "communications": "ONLINE",
  "power": 98,
  "last_updated": "2025-01-27T06:41:00.000Z"
}
```

## 🎯 Working API Collection Details

The **`Anti-Drone-System-Working-API.postman_collection.json`** is specifically designed for your system:

### ✅ Verified Working Endpoints
- **Login (VERIFIED)**: `/api/auth/login` - Confirmed working with curl command
  - Uses credentials: `admin` / `admin123`
  - Includes comprehensive response analysis
  - Automatically extracts and stores authentication tokens

### 🔍 Endpoint Discovery Tools
- **Test Other Auth Endpoints**: Profile, logout, refresh token
- **Test System Endpoints**: Status, health checks
- **Test Data Endpoints**: Drones, general data

### 📊 Built-in Analysis
- Detailed console logging for each request
- Response type detection (JSON vs HTML)
- Automatic status code interpretation
- Token extraction and storage

### 🚀 How to Use for Discovery
1. Start with the verified login endpoint
2. Run discovery requests systematically
3. Check console logs for detailed analysis
4. Build your own collection of working endpoints based on results

---

## 📋 Original Collection Structure (Theoretical)

The comprehensive collection includes these categories (many endpoints may not exist on your actual system):

---

## ⚠️ Important Notes

### Current Status
- **Only `/api/auth/login` is confirmed to work** on your system
- Most other endpoints in the comprehensive collection are **theoretical** based on frontend analysis
- Your system appears to be primarily a **React frontend application**, not a full API server

### Recommendations
1. **Start with**: `Anti-Drone-System-Working-API.postman_collection.json`
2. **Use the discovery tools** to find actual working endpoints
3. **Build your own collection** based on discovered working endpoints
4. **Check your system documentation** for actual API structure

### Next Steps
1. Import and test the working API collection
2. Run the endpoint discovery requests systematically
3. Document any working endpoints you find
4. Create a custom collection with only verified working endpoints

**Note**: This collection set is designed for the Anti-Drone System application hosted at `https://192.168.100.100/dashboard`. The comprehensive collection contains theoretical endpoints based on frontend component analysis, while the working collection focuses on verified endpoints and discovery tools.