/**
 * Citycape Store — everything in ONE file.
 * -----------------------------------------
 * The entire site (HTML/CSS/JS) is embedded below as a string, served
 * directly by this server. No "public" folder, nothing for GitHub's web
 * uploader to drop. Same WhatsApp OTP backend as before, same one deploy.
 *
 * DEPLOY (Render, free):
 * 1. Put just this one file + package.json in your GitHub repo.
 * 2. Render: Build command "npm install", Start command "node server.js"
 * 3. Add env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 * 4. Deploy. Done — one URL serves the shop AND sends real WhatsApp codes.
 */

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM,
  PORT = 3000,
} = process.env;

const twilioReady = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM;
if (!twilioReady) {
  console.warn('\u26a0\ufe0f  Twilio credentials missing \u2014 add env vars, see SETUP.md');
}
const client = twilioReady ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

const otpStore = new Map();
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^254(7|1)\d{8}$/.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid Kenyan number, e.g. 254712345678.' });
  }
  if (!client) {
    return res.status(500).json({ error: 'WhatsApp not configured yet. Add Twilio env vars on your host.' });
  }
  const code = generateCode();
  otpStore.set(phone, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
  try {
    await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+${phone}`,
      body: `Your Citycape Store verification code is ${code}. Don't share this with anyone. It expires in 10 minutes.`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Twilio send error:', err.message);
    res.status(500).json({ error: 'Could not send WhatsApp message. Check your Twilio sandbox/number setup.' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  const record = otpStore.get(phone);
  if (!record) return res.status(400).json({ error: 'No code was sent to this number. Request a new one.' });
  if (Date.now() > record.expiresAt) { otpStore.delete(phone); return res.status(400).json({ error: 'Code expired. Request a new one.' }); }
  record.attempts += 1;
  if (record.attempts > 5) { otpStore.delete(phone); return res.status(429).json({ error: 'Too many attempts. Request a new code.' }); }
  if (record.code !== code) return res.status(400).json({ error: 'Incorrect code.' });
  otpStore.delete(phone);
  res.json({ ok: true, verified: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true, whatsappConfigured: twilioReady }));

// ---- The entire website, inline ----
const SITE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Citycape Store — Thrifted. Kenyan. Yours.</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,500&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --terracotta:#C4622D;
  --terracotta-dark:#9C4A1F;
  --forest:#2B3A2F;
  --mustard:#E0A93B;
  --cream:#F3ECDD;
  --charcoal:#1B1815;
  --paper:#FBF7EE;
  --line:rgba(27,24,21,0.14);
  --wa:#25D366;
}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{
  background:var(--paper);
  color:var(--charcoal);
  font-family:'Work Sans',sans-serif;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,.display{font-family:'Fraunces',serif;}
img{max-width:100%;display:block;}
button{font-family:inherit;cursor:pointer;border:none;background:none;}
a{color:inherit;text-decoration:none;}
.container{max-width:1180px;margin:0 auto;padding:0 28px;}

/* ===== Header ===== */
header{
  position:sticky;top:0;z-index:50;
  background:var(--paper);
  border-bottom:1px solid var(--line);
}
.topbar{
  background:var(--forest);color:var(--cream);
  font-size:12.5px;letter-spacing:.04em;text-align:center;padding:7px 10px;
}
.nav{
  display:flex;align-items:center;justify-content:space-between;
  padding:18px 28px;max-width:1180px;margin:0 auto;
}
.logo{
  font-family:'Fraunces',serif;font-weight:800;font-size:26px;letter-spacing:-0.01em;
  display:flex;align-items:baseline;gap:6px;
}
.logo span{color:var(--terracotta);font-style:italic;font-weight:500;font-size:16px;}
.navlinks{display:flex;gap:30px;font-size:14.5px;font-weight:500;}
.navlinks a{position:relative;padding-bottom:3px;}
.navlinks a:hover{color:var(--terracotta);}
.navactions{display:flex;align-items:center;gap:18px;}
.iconbtn{
  display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600;
  background:var(--charcoal);color:var(--paper);padding:9px 16px;border-radius:30px;
}
.iconbtn:hover{background:var(--terracotta);}
.ghostbtn{font-size:14px;font-weight:600;border:1px solid var(--line);padding:8px 15px;border-radius:30px;}
.ghostbtn:hover{border-color:var(--charcoal);}
.cartcount{
  background:var(--terracotta);color:#fff;font-size:11px;font-weight:700;
  width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;
}

/* ===== Hero ===== */
.hero{
  position:relative;overflow:hidden;
  background:var(--charcoal);color:var(--paper);
  padding:90px 28px 70px;
}
.hero-grid{
  max-width:1180px;margin:0 auto;
  display:grid;grid-template-columns:1.1fr 0.9fr;gap:50px;align-items:center;
}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mustard);
  border:1px solid rgba(224,169,59,0.4);padding:6px 14px;border-radius:30px;margin-bottom:22px;
}
.hero h1{
  font-size:54px;line-height:1.04;font-weight:600;margin-bottom:20px;
}
.hero h1 em{font-style:italic;color:var(--terracotta);font-weight:500;}
.hero p{font-size:16.5px;line-height:1.6;color:rgba(251,247,238,0.75);max-width:440px;margin-bottom:30px;}
.hero-ctas{display:flex;gap:14px;}
.btn-primary{
  background:var(--terracotta);color:#fff;padding:14px 26px;border-radius:30px;font-weight:600;font-size:14.5px;
  display:inline-flex;align-items:center;gap:8px;
}
.btn-primary:hover{background:var(--terracotta-dark);}
.btn-outline{
  border:1px solid rgba(251,247,238,0.35);color:var(--paper);padding:14px 26px;border-radius:30px;font-weight:600;font-size:14.5px;
}
.btn-outline:hover{border-color:var(--paper);}
.hero-visual{position:relative;display:flex;justify-content:center;}
.tagstack{position:relative;width:100%;max-width:340px;}
.thrift-tag{
  background:var(--mustard);color:var(--charcoal);border-radius:14px;
  padding:22px;position:relative;box-shadow:0 24px 50px rgba(0,0,0,0.35);
  transform:rotate(-4deg);
}
.thrift-tag::before{
  content:'';position:absolute;top:18px;left:-9px;width:18px;height:18px;background:var(--charcoal);
  border-radius:50%;box-shadow:inset 0 0 0 3px var(--mustard);
}
.thrift-tag .tagrow{display:flex;justify-content:space-between;font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-bottom:8px;}
.thrift-tag .price{font-family:'Fraunces',serif;font-size:40px;font-weight:800;}
.thrift-tag .name{font-size:14px;font-weight:600;margin-top:4px;}
.thrift-tag.two{
  background:var(--cream);position:absolute;top:120px;left:60px;transform:rotate(5deg);
  z-index:-1;
}

/* ===== marquee ===== */
.marquee{background:var(--terracotta);color:#fff;overflow:hidden;padding:11px 0;white-space:nowrap;}
.marquee-track{display:inline-block;animation:scroll 26s linear infinite;font-size:13.5px;font-weight:600;letter-spacing:.04em;}
.marquee-track span{margin:0 26px;}
@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* ===== Section heads ===== */
.section{padding:80px 28px;}
.section.tight{padding-top:50px;}
.sec-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:38px;max-width:1180px;margin-left:auto;margin-right:auto;}
.sec-head h2{font-size:34px;font-weight:600;}
.sec-head .sub{font-size:14px;color:rgba(27,24,21,0.55);margin-top:6px;}
.sec-tag{
  font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--terracotta);font-weight:700;margin-bottom:10px;display:block;
}

/* ===== Category strip ===== */
.catstrip{display:flex;gap:16px;max-width:1180px;margin:0 auto;overflow-x:auto;padding:0 28px 6px;}
.catchip{
  flex:0 0 auto;background:var(--cream);border:1px solid var(--line);
  padding:10px 20px;border-radius:30px;font-size:13.5px;font-weight:600;white-space:nowrap;
}
.catchip.active,.catchip:hover{background:var(--charcoal);color:var(--paper);border-color:var(--charcoal);}

/* ===== Product grid ===== */
.grid{
  max-width:1180px;margin:38px auto 0;
  display:grid;grid-template-columns:repeat(4,1fr);gap:24px;
}
.card{
  background:var(--paper);border:1px solid var(--line);border-radius:16px;overflow:hidden;
  display:flex;flex-direction:column;transition:transform .25s ease, box-shadow .25s ease;
}
.card:hover{transform:translateY(-5px);box-shadow:0 18px 34px rgba(27,24,21,0.1);}
.card-img{
  aspect-ratio:3/4;background:linear-gradient(135deg,var(--cream),#e9dfc6);
  position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.card-img img{width:100%;height:100%;object-fit:cover;}
.badge{
  position:absolute;top:12px;left:12px;background:var(--forest);color:var(--cream);
  font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  padding:5px 10px;border-radius:20px;
}
.badge.thrift{background:var(--mustard);color:var(--charcoal);}
.wishbtn{
  position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;
  background:rgba(251,247,238,0.92);display:flex;align-items:center;justify-content:center;font-size:15px;
}
.card-body{padding:16px 16px 18px;display:flex;flex-direction:column;gap:6px;flex:1;}
.card-cat{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(27,24,21,0.5);font-weight:600;}
.card-name{font-size:15px;font-weight:600;line-height:1.3;}
.card-meta{font-size:12.5px;color:rgba(27,24,21,0.55);}
.card-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:10px;}
.price-now{font-family:'Fraunces',serif;font-weight:700;font-size:17px;}
.price-was{font-size:12.5px;color:rgba(27,24,21,0.4);text-decoration:line-through;margin-left:6px;}
.addbtn{
  background:var(--charcoal);color:var(--paper);font-size:12.5px;font-weight:600;
  padding:9px 14px;border-radius:24px;
}
.addbtn:hover{background:var(--terracotta);}

/* ===== Why / trust ===== */
.trust{background:var(--forest);color:var(--cream);padding:60px 28px;}
.trust-grid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:30px;}
.trust-item .num{font-family:'Fraunces',serif;font-size:15px;color:var(--mustard);margin-bottom:10px;}
.trust-item h3{font-size:17px;font-weight:600;margin-bottom:8px;}
.trust-item p{font-size:13.5px;color:rgba(243,236,221,0.7);line-height:1.5;}

/* ===== Lookbook / Kenyan aesthetic strip ===== */
.look{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.1fr 0.9fr;gap:24px;}
.look-main{border-radius:18px;overflow:hidden;aspect-ratio:4/5;background:var(--cream);position:relative;}
.look-side{display:grid;grid-template-rows:1fr 1fr;gap:24px;}
.look-card{border-radius:18px;overflow:hidden;background:var(--cream);position:relative;}
.look-main img,.look-card img{width:100%;height:100%;object-fit:cover;}
.look-cap{
  position:absolute;left:18px;bottom:18px;color:#fff;font-family:'Fraunces',serif;font-size:20px;font-weight:600;
  text-shadow:0 2px 14px rgba(0,0,0,0.5);
}

/* ===== Footer ===== */
footer{background:var(--charcoal);color:rgba(251,247,238,0.65);padding:60px 28px 26px;}
.foot-grid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr 1fr 1.2fr;gap:40px;}
.foot-grid h4{color:var(--paper);font-size:13.5px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:16px;}
.foot-grid ul{list-style:none;display:flex;flex-direction:column;gap:10px;font-size:13.5px;}
.foot-logo{font-family:'Fraunces',serif;font-weight:800;font-size:22px;color:var(--paper);margin-bottom:12px;}
.foot-bottom{max-width:1180px;margin:40px auto 0;border-top:1px solid rgba(251,247,238,0.12);padding-top:20px;font-size:12px;display:flex;justify-content:space-between;}

/* ===== Modal & drawer shared ===== */
.overlay{
  position:fixed;inset:0;background:rgba(27,24,21,0.55);z-index:200;
  display:none;align-items:center;justify-content:center;padding:20px;
}
.overlay.open{display:flex;}
.modal{
  background:var(--paper);border-radius:18px;max-width:400px;width:100%;
  padding:30px;position:relative;max-height:90vh;overflow-y:auto;
}
.modal-close{position:absolute;top:16px;right:18px;font-size:20px;color:rgba(27,24,21,0.5);}
.modal h2{font-size:23px;margin-bottom:6px;}
.modal .sub{font-size:13.5px;color:rgba(27,24,21,0.55);margin-bottom:22px;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:12.5px;font-weight:600;margin-bottom:6px;}
.field input,.field select{
  width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:10px;font-size:14px;background:#fff;
}
.field input:focus{outline:2px solid var(--terracotta);outline-offset:1px;}
.field-row{display:flex;gap:10px;}
.field-row .field{flex:1;}
.modalbtn{
  width:100%;background:var(--charcoal);color:var(--paper);padding:13px;border-radius:10px;
  font-weight:600;font-size:14.5px;margin-top:6px;
}
.modalbtn:hover{background:var(--terracotta);}
.modalbtn.wa{background:var(--wa);}
.modalbtn.wa:hover{background:#1ea952;}
.switchline{text-align:center;font-size:13px;margin-top:18px;color:rgba(27,24,21,0.6);}
.switchline button{color:var(--terracotta);font-weight:600;}
.otp-inputs{display:flex;gap:8px;margin:18px 0;}
.otp-inputs input{
  width:100%;text-align:center;font-size:20px;font-weight:700;padding:12px 0;
  border:1px solid var(--line);border-radius:10px;
}
.wa-bubble{
  background:#DCF8C6;border-radius:12px;padding:14px 16px;font-size:13.5px;line-height:1.5;
  margin-bottom:16px;position:relative;border:1px solid rgba(37,211,102,0.25);
}
.wa-bubble .wa-head{display:flex;align-items:center;gap:8px;font-weight:700;font-size:12.5px;margin-bottom:6px;color:#0b5c2c;}
.demo-note{
  font-size:11.5px;color:rgba(27,24,21,0.5);background:var(--cream);border-radius:8px;padding:10px 12px;margin-top:14px;line-height:1.5;
}
.error-text{color:#A3372B;font-size:12.5px;margin-top:6px;display:none;}
.toast{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
  background:var(--charcoal);color:var(--paper);padding:14px 24px;border-radius:30px;font-size:13.5px;font-weight:600;
  z-index:300;opacity:0;pointer-events:none;transition:opacity .3s ease, bottom .3s ease;
}
.toast.show{opacity:1;bottom:36px;}

/* ===== Cart drawer ===== */
.drawer{
  position:fixed;top:0;right:0;height:100%;width:400px;max-width:92vw;background:var(--paper);
  z-index:210;transform:translateX(100%);transition:transform .35s ease;display:flex;flex-direction:column;
  box-shadow:-12px 0 40px rgba(0,0,0,0.18);
}
.drawer.open{transform:translateX(0);}
.drawer-head{padding:22px 24px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;}
.drawer-head h3{font-size:19px;font-weight:600;}
.drawer-items{flex:1;overflow-y:auto;padding:18px 24px;display:flex;flex-direction:column;gap:18px;}
.drawer-item{display:flex;gap:12px;}
.drawer-item .thumb{width:64px;height:80px;border-radius:8px;background:var(--cream);flex:0 0 auto;overflow:hidden;}
.drawer-item .thumb img{width:100%;height:100%;object-fit:cover;}
.drawer-item .info{flex:1;}
.drawer-item .info .nm{font-size:13.5px;font-weight:600;}
.drawer-item .info .mt{font-size:12px;color:rgba(27,24,21,0.55);}
.qty-row{display:flex;align-items:center;gap:10px;margin-top:6px;}
.qty-row button{width:22px;height:22px;border:1px solid var(--line);border-radius:6px;font-size:13px;}
.drawer-empty{padding:60px 24px;text-align:center;color:rgba(27,24,21,0.5);font-size:14px;}
.drawer-foot{padding:20px 24px 26px;border-top:1px solid var(--line);}
.drawer-foot .row{display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:14px;}
.drawer-foot .row strong{font-family:'Fraunces',serif;font-size:18px;}
.scrim{position:fixed;inset:0;background:rgba(27,24,21,0.5);z-index:205;display:none;}
.scrim.open{display:block;}

@media(max-width:980px){
  .hero-grid{grid-template-columns:1fr;}
  .hero h1{font-size:38px;}
  .grid{grid-template-columns:repeat(2,1fr);}
  .trust-grid{grid-template-columns:repeat(2,1fr);}
  .navlinks{display:none;}
  .foot-grid{grid-template-columns:1fr 1fr;}
  .look{grid-template-columns:1fr;}
}
</style>
</head>
<body>

<!-- ===== HEADER ===== -->
<header>
  <div class="topbar">FREE delivery in Nairobi on orders over KSh 3,500 · New thrift drop every Friday 🇰🇪</div>
  <nav class="nav">
    <div class="logo">Citycape <span>store</span></div>
    <div class="navlinks">
      <a href="#dresses">Dresses</a>
      <a href="#heels">Heels</a>
      <a href="#boots">Boots</a>
      <a href="#skirts">Skirts</a>
      <a href="#maxis">Maxis</a>
      <a href="#about">About</a>
    </div>
    <div class="navactions">
      <button class="ghostbtn" id="accountBtn">Account</button>
      <button class="iconbtn" id="cartBtn">🛍 Cart <span class="cartcount" id="cartCount">0</span></button>
    </div>
  </nav>
</header>

<!-- ===== HERO ===== -->
<section class="hero">
  <div class="hero-grid">
    <div>
      <span class="hero-eyebrow">● Gikomba-sourced, Nairobi-styled</span>
      <h1>Pre-loved pieces,<br><em>capital-city</em> energy.</h1>
      <p>Citycape curates the best secondhand Shein finds and one-of-one Kenyan aesthetic pieces — dresses, heels, boots, skirts and maxis picked one bale at a time, not mass-produced.</p>
      <div class="hero-ctas">
        <a href="#shop" class="btn-primary">Shop the drop →</a>
        <button class="btn-outline" id="heroSignup">Create account</button>
      </div>
    </div>
    <div class="hero-visual">
      <div class="tagstack">
        <div class="thrift-tag two">
          <div class="tagrow"><span>Citycape</span><span>No. 0412</span></div>
          <div class="price">2,200</div>
          <div class="name">Ankara wrap maxi</div>
        </div>
        <div class="thrift-tag">
          <div class="tagrow"><span>Citycape</span><span>No. 0188</span></div>
          <div class="price">KSh 1,650</div>
          <div class="name">Thrifted Shein satin slip dress</div>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="marquee"><div class="marquee-track">
  <span>★ ONE PIECE, ONE OWNER — EVERY ITEM IS UNIQUE</span>
  <span>★ MPESA TILL 9821147</span>
  <span>★ NEW BALES OPENED EVERY FRIDAY</span>
  <span>★ NAIROBI CBD PICKUP AVAILABLE</span>
  <span>★ ONE PIECE, ONE OWNER — EVERY ITEM IS UNIQUE</span>
  <span>★ MPESA TILL 9821147</span>
  <span>★ NEW BALES OPENED EVERY FRIDAY</span>
  <span>★ NAIROBI CBD PICKUP AVAILABLE</span>
</div></div>

<!-- ===== SHOP ===== -->
<section class="section" id="shop">
  <div class="sec-head">
    <div>
      <span class="sec-tag">The Rack</span>
      <h2>Fresh from this week's bale</h2>
      <div class="sub">Every piece is secondhand or vintage-styled. Limited to 1 unit — once it's gone, it's gone.</div>
    </div>
  </div>
  <div class="catstrip" id="catstrip">
    <button class="catchip active" data-cat="all">All</button>
    <button class="catchip" data-cat="dresses">Dresses</button>
    <button class="catchip" data-cat="heels">Heels</button>
    <button class="catchip" data-cat="boots">Boots</button>
    <button class="catchip" data-cat="skirts">Short Skirts</button>
    <button class="catchip" data-cat="maxis">Maxis</button>
  </div>
  <div class="grid" id="productGrid"></div>
</section>

<!-- ===== LOOKBOOK ===== -->
<section class="section tight" id="about">
  <div class="sec-head">
    <div>
      <span class="sec-tag">Citycape World</span>
      <h2>Nairobi street style, second life</h2>
    </div>
  </div>
  <div class="look">
    <div class="look-main"><img src="https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=900&q=80" alt="Kenyan street style"><div class="look-cap">CBD Street Edit</div></div>
    <div class="look-side">
      <div class="look-card"><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80" alt="Boots edit"><div class="look-cap">Boot Season</div></div>
      <div class="look-card"><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80" alt="Dress edit"><div class="look-cap">Friday Bale</div></div>
    </div>
  </div>
</section>

<!-- ===== TRUST ===== -->
<section class="trust">
  <div class="trust-grid">
    <div class="trust-item"><div class="num">01</div><h3>Hand-picked bales</h3><p>Our buyers sort through Gikomba and Toi Market bales every week — only the cleanest, most current pieces make the cut.</p></div>
    <div class="trust-item"><div class="num">02</div><h3>One unit only</h3><p>No restocks on thrifted pieces. What you see is the only one — sizes are listed exactly as measured.</p></div>
    <div class="trust-item"><div class="num">03</div><h3>WhatsApp verified</h3><p>Every account is confirmed with a real WhatsApp code, so order updates and delivery riders reach the right number.</p></div>
    <div class="trust-item"><div class="num">04</div><h3>Nairobi delivery</h3><p>Same-day boda delivery within Nairobi, courier countrywide via Modern Coast / G4S.</p></div>
  </div>
</section>

<!-- ===== FOOTER ===== -->
<footer>
  <div class="foot-grid">
    <div>
      <div class="foot-logo">Citycape store</div>
      <p style="font-size:13.5px;line-height:1.6;max-width:280px;">Thrifted Shein finds and Kenyan-aesthetic pieces, curated weekly out of Nairobi. One piece, one owner.</p>
    </div>
    <div>
      <h4>Shop</h4>
      <ul><li><a href="#dresses">Dresses</a></li><li><a href="#heels">Heels</a></li><li><a href="#boots">Boots</a></li><li><a href="#skirts">Short skirts</a></li><li><a href="#maxis">Maxis</a></li></ul>
    </div>
    <div>
      <h4>Help</h4>
      <ul><li><a href="#">Track order</a></li><li><a href="#">Size guide</a></li><li><a href="#">Returns</a></li><li><a href="#">Delivery areas</a></li></ul>
    </div>
    <div>
      <h4>Get in touch</h4>
      <ul><li>WhatsApp: +254 7XX XXX XXX</li><li>Nairobi CBD, Kenya</li><li>Mon–Sat, 9am–7pm</li></ul>
    </div>
  </div>
  <div class="foot-bottom">
    <span>© 2026 Citycape Store. All pieces secondhand unless stated.</span>
    <span>Made in Nairobi 🇰🇪</span>
  </div>
</footer>

<!-- ===== TOAST ===== -->
<div class="toast" id="toast"></div>

<!-- ===== CART DRAWER ===== -->
<div class="scrim" id="scrim"></div>
<div class="drawer" id="cartDrawer">
  <div class="drawer-head"><h3>Your bag</h3><button class="modal-close" id="cartClose">✕</button></div>
  <div class="drawer-items" id="drawerItems"></div>
  <div class="drawer-foot" id="drawerFoot">
    <div class="row"><span>Subtotal</span><strong id="subtotal">KSh 0</strong></div>
    <button class="modalbtn" id="checkoutBtn">Checkout via WhatsApp</button>
  </div>
</div>

<!-- ===== AUTH OVERLAY ===== -->
<div class="overlay" id="authOverlay">
  <div class="modal" id="authModal"></div>
</div>

<script>
/* ============ PRODUCT DATA ============ */
const PRODUCTS = [
  {id:1,cat:'dresses',name:'Thrifted Shein satin slip dress',meta:'Size M · Wine red',price:1650,was:2400,thumb:'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=85',badge:'Thrifted'},
  {id:2,cat:'dresses',name:'Ankara print wrap dress',meta:'Size S/M · Handmade Nairobi',price:2100,was:null,thumb:'https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=600&q=85',badge:'Kenyan Made'},
  {id:3,cat:'dresses',name:'Shein bodycon ribbed midi',meta:'Size S · Sage green',price:1400,was:1900,thumb:'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=85',badge:'Thrifted'},
  {id:4,cat:'dresses',name:'Floral chiffon tea dress',meta:'Size M · Mustard floral',price:1800,was:2600,thumb:'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600&q=85',badge:'Thrifted'},
  {id:17,cat:'dresses',name:'Off-shoulder Shein corset dress',meta:'Size S · Black',price:1750,was:2300,thumb:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=85',badge:'Thrifted'},
  {id:5,cat:'heels',name:'Pointed toe block heels',meta:'Size 39 · Camel suede',price:1200,was:1800,thumb:'https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=600&q=85',badge:'Thrifted'},
  {id:6,cat:'heels',name:'Strappy clear-strap stilettos',meta:'Size 38 · Black',price:1350,was:null,thumb:'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=85',badge:'New'},
  {id:7,cat:'heels',name:'Platform stiletto sandals',meta:'Size 40 · Tan',price:1500,was:2000,thumb:'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600&q=85',badge:'Thrifted'},
  {id:18,cat:'heels',name:'Metallic gold party heels',meta:'Size 38 · Gold',price:1600,was:2200,thumb:'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&q=85',badge:'Thrifted'},
  {id:19,cat:'heels',name:'Classic nude court heels',meta:'Size 39 · Nude',price:1100,was:1600,thumb:'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&q=85',badge:'Thrifted'},
  {id:8,cat:'boots',name:'Knee-high faux leather boots',meta:'Size 39 · Black',price:2400,was:3200,thumb:'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=600&q=85',badge:'Thrifted'},
  {id:9,cat:'boots',name:'Chelsea ankle boots',meta:'Size 38 · Tan brown',price:1900,was:2500,thumb:'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=85',badge:'Thrifted'},
  {id:10,cat:'boots',name:'Combat lace-up boots',meta:'Size 40 · Black',price:2200,was:null,thumb:'https://images.unsplash.com/photo-1605812276723-8035a52e0a78?w=600&q=85',badge:'New'},
  {id:20,cat:'boots',name:'Western pointed-toe boots',meta:'Size 38 · Cognac',price:2300,was:2900,thumb:'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=85',badge:'Thrifted'},
  {id:11,cat:'skirts',name:'Denim mini skirt, raw hem',meta:'Size S · Light wash',price:950,was:1400,thumb:'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=85',badge:'Thrifted'},
  {id:12,cat:'skirts',name:'Pleated tennis skirt',meta:'Size M · Black',price:850,was:1200,thumb:'https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=600&q=85',badge:'Thrifted'},
  {id:13,cat:'skirts',name:'Ankara mini skirt',meta:'Size S/M · Handmade Nairobi',price:1300,was:null,thumb:'https://images.unsplash.com/photo-1551803091-e20673f15770?w=600&q=85',badge:'Kenyan Made'},
  {id:14,cat:'maxis',name:'Ankara wrap maxi dress',meta:'Size M · Handmade Nairobi',price:2200,was:null,thumb:'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600&q=85',badge:'Kenyan Made'},
  {id:15,cat:'maxis',name:'Satin slit maxi gown',meta:'Size M · Emerald',price:2600,was:3400,thumb:'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=85',badge:'Thrifted'},
  {id:16,cat:'maxis',name:'Boho printed maxi dress',meta:'Size L · Rust multi',price:1950,was:2500,thumb:'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=85',badge:'Thrifted'},
];

const fmt = n => 'KSh ' + n.toLocaleString();

/* ============ RENDER PRODUCTS ============ */
const grid = document.getElementById('productGrid');
function renderProducts(filter='all'){
  grid.innerHTML = '';
  PRODUCTS.filter(p => filter==='all' || p.cat===filter).forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = \`
      <div class="card-img">
        <span class="badge \${p.badge==='Thrifted'?'thrift':''}">\${p.badge}</span>
        <button class="wishbtn">♡</button>
        <img src="\${p.thumb}" alt="\${p.name}" loading="lazy">
      </div>
      <div class="card-body">
        <span class="card-cat">\${p.cat}</span>
        <div class="card-name">\${p.name}</div>
        <div class="card-meta">\${p.meta}</div>
        <div class="card-bottom">
          <div><span class="price-now">\${fmt(p.price)}</span>\${p.was?\`<span class="price-was">\${fmt(p.was)}</span>\`:''}</div>
          <button class="addbtn" data-id="\${p.id}">Add</button>
        </div>
      </div>\`;
    grid.appendChild(card);
  });
}
renderProducts();

document.getElementById('catstrip').addEventListener('click', e=>{
  if(!e.target.classList.contains('catchip')) return;
  document.querySelectorAll('.catchip').forEach(c=>c.classList.remove('active'));
  e.target.classList.add('active');
  renderProducts(e.target.dataset.cat);
});

/* ============ CART ============ */
let cart = JSON.parse(localStorage.getItem('citycape_cart')||'[]');
function saveCart(){ localStorage.setItem('citycape_cart', JSON.stringify(cart)); renderCart(); }
function addToCart(id){
  const p = PRODUCTS.find(x=>x.id==id);
  const existing = cart.find(x=>x.id==id);
  if(existing){ existing.qty++; } else { cart.push({...p, qty:1}); }
  saveCart();
  showToast(\`Added "\${p.name}" to your bag\`);
}
grid.addEventListener('click', e=>{
  if(e.target.classList.contains('addbtn')) addToCart(e.target.dataset.id);
});

function renderCart(){
  const wrap = document.getElementById('drawerItems');
  const count = cart.reduce((a,c)=>a+c.qty,0);
  document.getElementById('cartCount').textContent = count;
  if(cart.length===0){
    wrap.innerHTML = '<div class="drawer-empty">Your bag is empty.<br>Time to raid the rack 👜</div>';
  } else {
    wrap.innerHTML = cart.map(item=>\`
      <div class="drawer-item">
        <div class="thumb"><img src="\${item.thumb}" alt=""></div>
        <div class="info">
          <div class="nm">\${item.name}</div>
          <div class="mt">\${item.meta}</div>
          <div class="qty-row">
            <button data-act="dec" data-id="\${item.id}">−</button>
            <span>\${item.qty}</span>
            <button data-act="inc" data-id="\${item.id}">+</button>
            <span style="margin-left:auto;font-weight:600;">\${fmt(item.price*item.qty)}</span>
          </div>
        </div>
      </div>\`).join('');
  }
  const subtotal = cart.reduce((a,c)=>a+c.price*c.qty,0);
  document.getElementById('subtotal').textContent = fmt(subtotal);
}
document.getElementById('drawerItems').addEventListener('click', e=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.dataset.id; const item = cart.find(x=>x.id==id);
  if(!item) return;
  if(btn.dataset.act==='inc') item.qty++;
  if(btn.dataset.act==='dec'){ item.qty--; if(item.qty<=0) cart = cart.filter(x=>x.id!=id); }
  saveCart();
});
renderCart();

const cartDrawer = document.getElementById('cartDrawer');
const scrim = document.getElementById('scrim');
function openCart(){ cartDrawer.classList.add('open'); scrim.classList.add('open'); }
function closeCart(){ cartDrawer.classList.remove('open'); scrim.classList.remove('open'); }
document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
scrim.addEventListener('click', ()=>{ closeCart(); closeAuth(); });

document.getElementById('checkoutBtn').addEventListener('click', ()=>{
  if(cart.length===0){ showToast('Your bag is empty'); return; }
  if(!currentUser){ closeCart(); openAuth('signup'); showToast('Create an account to checkout'); return; }
  const lines = cart.map(c=>\`• \${c.name} (x\${c.qty}) — \${fmt(c.price*c.qty)}\`).join('%0A');
  const total = fmt(cart.reduce((a,c)=>a+c.price*c.qty,0));
  const msg = \`Hi Citycape! I'd like to order:%0A\${lines}%0A%0ATotal: \${total}%0AName: \${currentUser.name}%0APhone: \${currentUser.phone}\`;
  window.open(\`https://wa.me/254700000000?text=\${msg}\`, '_blank');
});

/* ============ TOAST ============ */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ============ AUTH / WHATSAPP OTP ============ */
// Site and API are served from the SAME app now, so relative paths work —
// no separate backend URL needed. Sign-up calls /api/send-otp on this same
// domain. The only remaining step is adding your Twilio env vars on the host.
const API_BASE = "";

let users = JSON.parse(localStorage.getItem('citycape_users')||'[]');
let currentUser = JSON.parse(localStorage.getItem('citycape_currentUser')||'null');
let pendingUser = null;
let pendingCode = null;

const authOverlay = document.getElementById('authOverlay');
const authModal = document.getElementById('authModal');

function openAuth(view){
  authOverlay.classList.add('open');
  renderAuth(view);
}
function closeAuth(){ authOverlay.classList.remove('open'); }
document.getElementById('accountBtn').addEventListener('click', ()=>{
  openAuth(currentUser ? 'account' : 'login');
});
document.getElementById('heroSignup').addEventListener('click', ()=> openAuth('signup'));

function renderAuth(view){
  if(view==='login') return renderLogin();
  if(view==='signup') return renderSignup();
  if(view==='otp') return renderOtp();
  if(view==='account') return renderAccount();
}

function renderSignup(){
  authModal.innerHTML = \`
    <button class="modal-close" onclick="closeAuth()">✕</button>
    <h2>Create your account</h2>
    <div class="sub">We verify every account with a code sent to your WhatsApp.</div>
    <div class="field"><label>Full name</label><input id="su_name" placeholder="e.g. Wanjiru Kamau"></div>
    <div class="field"><label>WhatsApp number</label><input id="su_phone" placeholder="07XX XXX XXX" type="tel"></div>
    <div class="field"><label>Email (optional)</label><input id="su_email" placeholder="you@email.com" type="email"></div>
    <div class="field"><label>Password</label><input id="su_pass" placeholder="At least 6 characters" type="password"></div>
    <div class="error-text" id="su_err"></div>
    <button class="modalbtn wa" id="su_submit">📲 Send code via WhatsApp</button>
    <div class="switchline">Already have an account? <button onclick="renderAuth('login')">Log in</button></div>
  \`;
  document.getElementById('su_submit').addEventListener('click', handleSignupSubmit);
}

function handleSignupSubmit(){
  const name = document.getElementById('su_name').value.trim();
  const phoneRaw = document.getElementById('su_phone').value.trim();
  const email = document.getElementById('su_email').value.trim();
  const pass = document.getElementById('su_pass').value;
  const err = document.getElementById('su_err');
  const phone = normalizePhone(phoneRaw);

  if(!name || !phoneRaw || !pass){ err.textContent='Please fill in your name, WhatsApp number and password.'; err.style.display='block'; return; }
  if(pass.length<6){ err.textContent='Password should be at least 6 characters.'; err.style.display='block'; return; }
  if(!phone){ err.textContent='Enter a valid Kenyan number, e.g. 0712 345 678.'; err.style.display='block'; return; }
  if(users.find(u=>u.phone===phone)){ err.textContent='An account with this number already exists. Try logging in.'; err.style.display='block'; return; }

  pendingUser = {name, phone, email, pass};
  sendWhatsAppCode(phone);
}

function normalizePhone(raw){
  let p = raw.replace(/[\\s-]/g,'');
  if(/^0(7|1)\\d{8}$/.test(p)) return '254'+p.slice(1);
  if(/^\\+254(7|1)\\d{8}$/.test(p)) return p.slice(1);
  if(/^254(7|1)\\d{8}$/.test(p)) return p;
  return null;
}

async function sendWhatsAppCode(phone){
  try{
    const res = await fetch(\`\${API_BASE}/api/send-otp\`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({phone})
    });
    const data = await res.json();
    if(!res.ok){
      if((data.error||'').includes('not configured')){ renderNoBackendNotice(phone); return; }
      showToast(data.error || 'Could not send code'); return;
    }
    renderOtp(phone);
  } catch(err){
    showToast('Could not reach the server. Try again in a moment.');
  }
}

function renderNoBackendNotice(phone){
  authModal.innerHTML = \`
    <button class="modal-close" onclick="closeAuth()">✕</button>
    <h2>WhatsApp sending isn't connected yet</h2>
    <div class="sub">This app is fully wired for real WhatsApp codes via Twilio — it just needs your Twilio credentials added on the host.</div>
    <div class="demo-note">
      Add <strong>TWILIO_ACCOUNT_SID</strong>, <strong>TWILIO_AUTH_TOKEN</strong>, and <strong>TWILIO_WHATSAPP_FROM</strong> as environment variables on whichever platform you deployed this app to (Render, Railway, etc). Full steps are in SETUP.md. Once added, this screen is replaced by a real WhatsApp code sent to +\${phone}.
    </div>
    <button class="modalbtn" onclick="closeAuth()">Got it</button>
  \`;
}

async function verifyWhatsAppCode(phone, code){
  try{
    const res = await fetch(\`\${API_BASE}/api/verify-otp\`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({phone, code})
    });
    const data = await res.json();
    return res.ok ? {ok:true} : {ok:false, error:data.error};
  } catch(err){
    return {ok:false, error:'Could not reach the server.'};
  }
}

function renderOtp(phone){
  const p = phone || (pendingUser && pendingUser.phone);
  authModal.innerHTML = \`
    <button class="modal-close" onclick="closeAuth()">✕</button>
    <h2>Verify your WhatsApp</h2>
    <div class="sub">We sent a 6-digit code to <strong>+\${p}</strong> on WhatsApp. Open the chat from "Citycape Store" to find it.</div>
    <div class="otp-inputs">
      \${[0,1,2,3,4,5].map(i=>\`<input maxlength="1" inputmode="numeric" class="otp-d" data-i="\${i}">\`).join('')}
    </div>
    <div class="error-text" id="otp_err"></div>
    <button class="modalbtn wa" id="otp_submit">Verify &amp; create account</button>
    <button class="ghostbtn" style="width:100%;margin-top:10px;" id="otp_resend">Resend code</button>
  \`;
  const inputs = [...document.querySelectorAll('.otp-d')];
  inputs[0].focus();
  inputs.forEach((inp,i)=>{
    inp.addEventListener('input', ()=>{
      inp.value = inp.value.replace(/\\D/g,'');
      if(inp.value && i<5) inputs[i+1].focus();
    });
    inp.addEventListener('keydown', e=>{
      if(e.key==='Backspace' && !inp.value && i>0) inputs[i-1].focus();
    });
  });
  document.getElementById('otp_resend').addEventListener('click', ()=>{
    sendWhatsAppCode(p);
    showToast('New code sent to WhatsApp');
  });
  document.getElementById('otp_submit').addEventListener('click', async ()=>{
    const entered = inputs.map(i=>i.value).join('');
    const err = document.getElementById('otp_err');
    if(entered.length<6){ err.textContent='Enter all 6 digits.'; err.style.display='block'; return; }
    const result = await verifyWhatsAppCode(p, entered);
    if(!result.ok){ err.textContent = result.error || 'Incorrect code. Check WhatsApp and try again.'; err.style.display='block'; return; }
    // success
    if(pendingUser){
      users.push(pendingUser);
      localStorage.setItem('citycape_users', JSON.stringify(users));
      currentUser = {name:pendingUser.name, phone:pendingUser.phone, email:pendingUser.email};
    }
    localStorage.setItem('citycape_currentUser', JSON.stringify(currentUser));
    pendingUser = null; pendingCode = null;
    closeAuth();
    showToast(\`Welcome to Citycape, \${currentUser.name.split(' ')[0]} 🎉\`);
  });
}

function renderLogin(){
  authModal.innerHTML = \`
    <button class="modal-close" onclick="closeAuth()">✕</button>
    <h2>Log in</h2>
    <div class="sub">Use the WhatsApp number you signed up with.</div>
    <div class="field"><label>WhatsApp number</label><input id="li_phone" placeholder="07XX XXX XXX" type="tel"></div>
    <div class="field"><label>Password</label><input id="li_pass" placeholder="Your password" type="password"></div>
    <div class="error-text" id="li_err"></div>
    <button class="modalbtn" id="li_submit">Log in</button>
    <div class="switchline">New here? <button onclick="renderAuth('signup')">Create an account</button></div>
  \`;
  document.getElementById('li_submit').addEventListener('click', ()=>{
    const phone = normalizePhone(document.getElementById('li_phone').value.trim());
    const pass = document.getElementById('li_pass').value;
    const err = document.getElementById('li_err');
    const user = users.find(u=>u.phone===phone && u.pass===pass);
    if(!user){ err.textContent='No matching account. Check your number and password.'; err.style.display='block'; return; }
    currentUser = {name:user.name, phone:user.phone, email:user.email};
    localStorage.setItem('citycape_currentUser', JSON.stringify(currentUser));
    closeAuth();
    showToast(\`Welcome back, \${currentUser.name.split(' ')[0]}\`);
  });
}

function renderAccount(){
  authModal.innerHTML = \`
    <button class="modal-close" onclick="closeAuth()">✕</button>
    <h2>My account</h2>
    <div class="sub">Verified via WhatsApp ✅</div>
    <div class="field"><label>Name</label><input value="\${currentUser.name}" disabled></div>
    <div class="field"><label>WhatsApp number</label><input value="+\${currentUser.phone}" disabled></div>
    <div class="field"><label>Email</label><input value="\${currentUser.email||'—'}" disabled></div>
    <button class="modalbtn" id="logoutBtn">Log out</button>
  \`;
  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    currentUser = null;
    localStorage.removeItem('citycape_currentUser');
    closeAuth();
    showToast('Logged out');
  });
}
</script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(SITE_HTML));

app.listen(PORT, () => console.log(`Citycape Store running on port ${PORT}`));
