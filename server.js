const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurations
const ADMIN_KEY = process.env.ADMIN_KEY || 'citycape2026';
const STORE_WHATSAPP = process.env.STORE_WHATSAPP || '254758509154';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory store for pending verifications
const pendingVerifications = new Map();

// 8-Digit Code Generator
const generateCode = () => String(Math.floor(10000000 + Math.random() * 90000000));

// --- UPGRADED ADMIN HUB ROUTE ---
app.get('/api/admin/pending', (req, res) => {
    const key = req.query.key;
    if (key !== ADMIN_KEY) {
        return res.status(403).send(`
            <div style="font-family:sans-serif; text-align:center; padding:50px;">
                <h1 style="color:#d27d5d;">🚫 Access Denied</h1>
                <p>Invalid or missing Admin Secret Key.</p>
            </div>
        `);
    }

    let rows = '';
    let count = 0;
    
    pendingVerifications.forEach((data, phone) => {
        count++;
        const waLink = `https://wa.me/${phone}?text=Your%20Citycapestore%20verification%20code%20is:%20${data.code}`;
        rows += `
            <div class="code-card">
                <div class="card-info">
                    <div class="phone-num">📱 +${phone}</div>
                    <div class="timestamp">Requested: ${new Date(data.timestamp).toLocaleTimeString()}</div>
                </div>
                <div class="otp-display">${data.code}</div>
                <a href="${waLink}" target="_blank" class="action-btn">Send via WhatsApp</a>
            </div>
        `;
    });

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Citycape Hub — Admin Panel</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="refresh" content="15">
            <style>
                :root { --terracotta: #d27d5d; --charcoal: #222222; --paper: #f9f6f0; --whatsapp: #25D366; }
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--paper); color: var(--charcoal); margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); margin-bottom: 20px; border: 1px solid rgba(0,0,0,0.05); }
                .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
                .header h1 span { color: var(--terracotta); }
                .status-bar { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #666; }
                .badge { background: ${count > 0 ? 'var(--terracotta)' : '#e0e0e0'}; color: ${count > 0 ? 'white' : '#666'}; padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; }
                .code-list { display: flex; flex-direction: column; gap: 12px; }
                .code-card { background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; }
                .card-info { display: flex; justify-content: space-between; align-items: flex-start; }
                .phone-num { font-weight: 700; font-size: 18px; }
                .timestamp { font-size: 12px; color: #999; }
                .otp-display { font-size: 32px; font-weight: 800; letter-spacing: 4px; color: var(--charcoal); font-family: monospace; padding: 8px 0; border-bottom: 2px dashed #eee; text-align: center; }
                .action-btn { background: var(--whatsapp); color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-weight: bold; font-size: 15px; transition: opacity 0.2s; display: block; }
                .action-btn:hover { opacity: 0.9; }
                .empty-state { text-align: center; padding: 40px 20px; color: #999; font-size: 15px; background: white; border-radius: 16px; border: 1px dashed #ccc; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>citycape<span>hub.</span></h1>
                    <div class="status-bar">
                        <span>Live Verification Queue (15s auto-refresh)</span>
                        <span class="badge">${count} Pending</span>
                    </div>
                </div>
                
                <div class="code-list">
                    ${rows || '<div class="empty-state">✨ No pending requests. Monitoring queue live...</div>'}
                </div>
            </div>
        </body>
        </html>
    `);
});

// --- FRONTEND STOREFRONT ROUTE ---
app.get('/', (req, res) => {
    const activePhone = req.query.phone || '';
    let waLink = '';
    
    if (activePhone && pendingVerifications.has(activePhone)) {
        const customMessage = encodeURIComponent(`Hello Citycapestore! I am registering my account. Please provide my verification code for phone number: ${activePhone}`);
        waLink = `https://wa.me/${STORE_WHATSAPP}?text=${customMessage}`;
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Citycape Store</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                :root { --terracotta: #d27d5d; --terracotta-dark: #b86546; --charcoal: #222222; --paper: #f9f6f0; --mustard: #e5ad35; }
                body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; background-color: var(--paper); color: var(--charcoal); }
                .navbar { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background: white; border-bottom: 1px solid rgba(0,0,0,0.05); }
                .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: var(--charcoal); }
                .hero { padding: 80px 40px; text-align: left; max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; }
                .hero-text { flex: 1; min-width: 300px; }
                .hero h1 { font-size: 54px; line-height: 1.04; font-weight: 600; margin-bottom: 20px; }
                .hero h1 em { font-style: italic; color: var(--terracotta); font-weight: 500; }
                .hero p { font-size: 16.5px; line-height: 1.6; color: rgba(34,34,34,0.7); max-width: 440px; }
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); width: 100%; max-width: 360px; box-sizing: border-box; }
                .thrift-tag { background: var(--mustard); color: var(--charcoal); display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-radius: 2px; transform: rotate(-2deg); margin-bottom: 15px; }
                input, button { width: 100%; padding: 14px; margin: 10px 0; border-radius: 6px; border: 1px solid #ddd; box-sizing: border-box; font-size: 15px; }
                input:focus { border-color: var(--terracotta); outline: none; }
                .btn-primary { background-color: var(--terracotta); color: white; border: none; font-weight: bold; cursor: pointer; transition: background 0.2s; }
                .btn-primary:hover { background-color: var(--terracotta-dark); }
                .btn-whatsapp { background-color: #25D366; color: white; text-decoration: none; display: block; text-align: center; padding: 14px; border-radius: 6px; font-weight: bold; margin: 10px 0; box-sizing: border-box; }
                .btn-whatsapp:hover { background-color: #128C7E; }
                .step-title { font-size: 14px; font-weight: bold; color: #777; text-transform: uppercase; margin-top: 15px; text-align: left; }
            </style>
        </head>
        <body>
            <div class="navbar">
                <div class="logo">citycape<span style="color:var(--terracotta);">store.</span></div>
            </div>
            
            <div class="hero">
                <div class="hero-text">
                    <div class="thrift-tag">Handpicked Vintage</div>
                    <h1>Curated street style,<br>made <em>effortless.</em></h1>
                    <p>Welcome to the official Citycape Store Notification Hub setup. Complete verification to connect your customer interface.</p>
                </div>
                
                <div class="card">
                    <h3 style="margin-top:0; font-size:20px;">Customer Access</h3>
                    
                    <form action="/request-otp" method="POST">
                        <div class="step-title">Step 1: Enter WhatsApp Number</div>
                        <input type="text" name="phone" value="${activePhone}" placeholder="e.g. 254700000000" required />
                        <button type="submit" class="btn-primary">Generate My Code</button>
                    </form>

                    ${activePhone ? `
                        <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                        <div class="step-title">Step 2: Get Your Code</div>
                        <a href="${waLink}" target="_blank" class="btn-whatsapp">Open WhatsApp to Request</a>
                        
                        <form action="/verify-otp" method="POST">
                            <div class="step-title">Step 3: Enter 8-Digit Code</div>
                            <input type="hidden" name="phone" value="${activePhone}" />
                            <input type="text" name="otp" placeholder="Enter 8-digit code" required />
                            <button type="submit" class="btn-primary" style="background:#222;">Verify & Enter Store</button>
                        </form>
                    ` : ''}
                </div>
            </div>
        </body>
        </html>
    `);
});

// --- ROUTE: REQUEST OTP ---
app.post('/request-otp', (req, res) => {
    let { phone } = req.body;
    phone = phone.replace(/[^0-9]/g, '');
    
    if (!phone) return res.redirect('/');

    const code = generateCode();
    pendingVerifications.set(phone, {
        code: code,
        timestamp: Date.now()
    });
    
    res.redirect(`/?phone=${phone}`);
});

// --- ROUTE: VERIFY OTP ---
app.post('/verify-otp', (req, res) => {
    const { otp, phone } = req.body;
    const record = pendingVerifications.get(phone);

    if (record && record.code === otp.trim()) {
        pendingVerifications.delete(phone); 
        res.send('<h2>Success! Account verified and created. Welcome to Citycapestore!</h2><br><a href="/">Back to Store</a>');
    } else {
        res.send('<h2>Invalid 8-digit verification code. Please check with admin or retry.</h2><br><a href="/?phone=' + phone + '">Try Again</a>');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
