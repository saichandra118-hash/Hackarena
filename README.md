# SAHAYI (సహాయి) — Voice-First Government Services for Rural Women

> **Tagline:** “Just speak. We’ll guide you.” / “మాట్లాడండి — నేను మీకు దారి చూపిస్తాను.”  
> **Mission:** An AI-powered voice assistant built for first-time rural women internet users in India with zero prior digital literacy, guiding them to independently discover, evaluate, and navigate essential government welfare schemes.

---

## 🌟 Core Highlights

- **Zero-Knowledge Design:**
  - One question at a time — no complex government forms, no dropdown menus, no tech jargon.
  - Huge touch targets (min 64px) with high-contrast accessibility (WCAG AAA).
  - Clear Telugu typography (`Nirmala UI`, `Noto Sans Telugu`, `Mandali`).
- **Voice-First Experience:**
  - Regional language Speech-to-Text (`te-IN` Telugu, with architecture supporting Hindi, Tamil, and English).
  - Patient, warm maternal Text-to-Speech playback calibrated for first-time rural listeners (slower rate, reassuring tone).
  - Persistent bottom control dock:
    - 🔊 **మళ్లీ విను** (Listen Again)
    - 🎤 **మాట్లాడండి** (Floating Mic Button)
    - ↩ **వెనక్కి** (Step Back)
    - 🏠 **మొదటికి** (Start Over)
    - 📞 **సహాయం** (Official Helpline)
- **Flagship Verified Government Scheme:**
  - **Pradhan Mantri Ujjwala Yojana 2.0 (PMUY)** — Verified official data from the Ministry of Petroleum and Natural Gas (`pmuy.gov.in`).
  - Modular schema containing **PMMVY** (Maternity cash assistance ₹5,000/6,000) and **Lakhpati Didi / DAY-NRLM** (SHG women micro-business).
- **Conversational Intelligence:**
  - Powered by Gemini 2.5 Flash with a compassionate village guide system prompt.
  - **100% Resilient Local Fallback Engine:** Semantic classifier that functions seamlessly offline or without an API key.
  - Strict compliance: Never hallucinates welfare benefits; clarifies that final approval rests with the Government.
- **Visual Step-by-Step Portal Companion:**
  - Rather than simply dumping a link, SahayI simulates the actual `pmuy.gov.in` screens with pulsating spotlights guiding the user on where to click, where to choose distributors (Indane, Bharatgas, HP), and how to verify mobile OTP.
- **Document Assistant:**
  - Interactive cards for Aadhaar, Ration Card, and Bank Passbook with single-tap voice explanations ("ఈ పత్రం ఎందుకు అవసరం?").
- **Trust & Safety:**
  - Prominent notices warning users to never share OTP or bank PINs.
  - Direct 1-tap call to the official toll-free helpline **1800-266-6696** and LPG 24/7 emergency **1906**.
- **Interactive Demo Tour:**
  - One-click "డెమో (Try Demo)" mode simulating the complete journey for hackathon judges and evaluators.

---

## 🚀 Getting Started

### 1. Requirements
- Node.js 18+ (tested on Node.js v24.19 LTS)
- Modern web browser (Chrome, Edge, Safari, or Firefox with Web Speech API support)

### 2. Run Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000/
```

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture Overview

```
User Voice / Tap (Telugu)
   │
   ▼
[Web Speech API (te-IN) / UI Fast-Choice Pills]
   │
   ▼
[Gemini 2.5 Flash / Semantic Reasoning Engine]
   │
   ▼
[Verified Government Schemes Database (schemes.ts)]
   │
   ├── Flagship: PM Ujjwala Yojana 2.0 (Free LPG connection & ₹300 subsidy)
   ├── Secondary: PMMVY (Maternity cash aid ₹5,000 / ₹6,000)
   └── Secondary: Lakhpati Didi / SHG (Micro-enterprise loans & training)
   │
   ▼
[Adaptive 1-Question Eligibility Evaluation]
   │
   ▼
[Potential Eligibility Disclaimer ("తుది అర్హతను ప్రభుత్వం నిర్ధారిస్తుంది")]
   │
   ▼
[Visual Document Assistant (Aadhaar, Ration Card, Bank Passbook)]
   │
   ▼
[Interactive Visual Portal Simulator + Official Government Source (pmuy.gov.in)]
   │
   ▼
[Official Helpline: 1800-266-6696 / 1906 Direct Dialer]
```

---

## 🛡️ Trust & Safety Principles

1. **No Sensitive Data Stored:** No Aadhaar numbers, OTPs, or passwords are asked, processed, or logged.
2. **Transparent Authority:** Every scheme clearly links to verified Government of India portals.
3. **Realistic Expectations:** Always distinguishes between "likely eligible based on user answers" and "officially approved by the government authority".

---

## 👥 Hackathon Demonstration Guide

1. Open `http://localhost:3000/`.
2. Notice the welcoming Telugu greeting: *"మీకు ఏ సహాయం కావాలి? మాట్లాడండి — నేను మీకు దారి చూపిస్తాను."*
3. Click **🔊 నమస్కారం వినండి** or tap the giant **🎤 మాట్లాడండి** button.
4. Say *"నాకు వంట గ్యాస్ సిలిండర్ కావాలి"* (or tap the **ఉచిత గ్యాస్ కనెక్షన్ (ఉజ్జ్వల 2.0)** card).
5. Walk through the 3 simple single-question cards (Existing gas, 18+ age, ration card status).
6. View the eligibility result and tap **కావాల్సిన పత్రాలు చూడండి**.
7. Test the document assistant audio: tap **🔊 వివరణ వినండి** on any document card.
8. Tap **దరఖాస్తు ఎలా చేయాలో చూడండి** to experience the visual portal navigator simulator.
9. Try the top **డెమో (Try Demo)** button anytime for an automated presentation walkthrough!
