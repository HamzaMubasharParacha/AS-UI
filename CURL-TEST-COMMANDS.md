# Curl Test Commands for Rapiguard System

## 🔐 Login Test (Session-Based Authentication)

### Basic Login Test
```bash
curl --location "https://192.168.100.100/api/auth/login" \
  --header "Content-Type: application/json" \
  --data '{"username": "root", "password": "lzno1root", "remember": true}' \
  --insecure --verbose
```

**Expected Result**: 
- Status: `HTTP/1.1 302 Found` (redirect)
- Location: `/` 
- Then automatically follows redirect and returns HTML page

### Login with Cookie Jar (Recommended)
```bash
curl --location "https://192.168.100.100/api/auth/login" \
  --header "Content-Type: application/json" \
  --data '{"username": "root", "password": "lzno1root", "remember": true}' \
  --cookie-jar cookies.txt \
  --insecure --verbose
```

**Expected Result**: Same as above + saves session cookies to `cookies.txt`

## 📋 Configuration Endpoints (Working)

### System Configuration
```bash
curl --location "https://192.168.100.100/config/config.json" \
  --header "Accept: application/json" \
  --insecure --verbose
```

**Expected Result**: 
- Status: `HTTP/1.1 200 OK`
- Content-Type: `application/json`
- JSON response with system config

### System Information
```bash
curl --location "https://192.168.100.100/asset/extra.json" \
  --header "Accept: application/json" \
  --insecure --verbose
```

**Expected Result**: 
- Status: `HTTP/1.1 200 OK`
- Content-Type: `application/json`
- JSON response with Rapiguard system info

## 🔍 API Discovery Tests

### Test API Status (Requires Authentication)
```bash
curl --location "https://192.168.100.100/api/status" \
  --header "Accept: application/json" \
  --insecure --verbose
```

**Expected Result**: 
- Status: `HTTP/1.1 302 Found` (redirect to login)
- Means endpoint exists but requires authentication

### Test with Session Cookies
```bash
# First login and save cookies
curl --location "https://192.168.100.100/api/auth/login" \
  --header "Content-Type: application/json" \
  --data '{"username": "root", "password": "lzno1root", "remember": true}' \
  --cookie-jar cookies.txt --insecure

# Then test authenticated endpoint
curl --location "https://192.168.100.100/api/status" \
  --header "Accept: application/json" \
  --cookie cookies.txt \
  --insecure --verbose
```

## 🌐 Frontend Tests

### Main Application
```bash
curl --location "https://192.168.100.100/" \
  --header "Accept: text/html" \
  --insecure --verbose
```

### Dashboard Route
```bash
curl --location "https://192.168.100.100/dashboard" \
  --header "Accept: text/html" \
  --insecure --verbose
```

## 🧪 Test Different Credentials (Should Fail)

### Wrong Password
```bash
curl --location "https://192.168.100.100/api/auth/login" \
  --header "Content-Type: application/json" \
  --data '{"username": "root", "password": "wrongpassword", "remember": true}' \
  --insecure --verbose
```

### Wrong Username
```bash
curl --location "https://192.168.100.100/api/auth/login" \
  --header "Content-Type: application/json" \
  --data '{"username": "admin", "password": "lzno1root", "remember": true}' \
  --insecure --verbose
```

## 📊 What to Look For

### Successful Login Indicators:
- ✅ Status: `302 Found` followed by `200 OK`
- ✅ Location header: `/`
- ✅ HTML response containing "maptalks", "mapbox", "lizhengtech"
- ✅ Response contains `<div id="root"></div>`

### Failed Login Indicators:
- ❌ Different status code (401, 403, etc.)
- ❌ Different redirect location
- ❌ Error message in response

### System Confirmation:
- ✅ `/config/config.json` returns JSON with system settings
- ✅ `/asset/extra.json` contains `"site.name": "Rapiguard"`
- ✅ Headers show `X-Powered-By: Express`

## 🔧 Troubleshooting

### SSL Certificate Issues
If you get SSL errors, add `--insecure` flag (already included above)

### Connection Issues
If connection fails:
```bash
# Test basic connectivity
curl --insecure "https://192.168.100.100/"

# Test with different timeout
curl --connect-timeout 10 --max-time 30 --insecure "https://192.168.100.100/"
```

### Verbose Output
The `--verbose` flag shows:
- Connection details
- Request headers sent
- Response headers received
- Redirect information

---

**Test these commands and let me know the exact responses you get. This will help me update the Postman collection to match your system's exact behavior.**