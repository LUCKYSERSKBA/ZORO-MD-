# 🚀 INCONNU BOY — Deployment Guide

> Open Source WhatsApp Bot — Deploy in minutes on Render, Railway or Heroku

<div align="center">

[![WhatsApp Channel](https://img.shields.io/badge/WhatsApp%20Channel-Follow%20for%20Updates-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VbC6It7K0IBkQwaKYd2J)
[![GitHub](https://img.shields.io/badge/GitHub-INCONNU--BOY-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/INCONNU-BOY)

</div>

---

## 📣 Support & Updates

| Platform | Link |
|---|---|
| 📺 **WhatsApp Channel** (tutorials, updates, news) | [Follow here](https://whatsapp.com/channel/0029VbC6It7K0IBkQwaKYd2J) |
| 💻 **GitHub** (source code, issues, PRs) | [github.com/INCONNU-BOY](https://github.com/INCONNU-BOY) |

> 💡 Join the WhatsApp channel to get notified when new features, bug fixes or tutorials are posted.

---

## 📋 Prerequisites (All Platforms)

Before deploying, you need:

1. **MongoDB URI** — Free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. **Your WhatsApp number** — with country code, no `+` (ex: `22890000000`)
3. **Node.js 18+** (only for local testing)

### Get a MongoDB URI (free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) → Create account
2. Create a free cluster (M0)
3. Click **Connect** → **Drivers** → Copy the URI
4. Replace `<password>` with your DB password

---

## ⚙️ Environment Variables

Set these on every platform:

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | Your MongoDB connection string | `mongodb+srv://user:pass@cluster...` |
| `OWNER_NUMBER` | Your WhatsApp number (no +) | `22890000000` |
| `PREFIX` | Bot command prefix | `.` |
| `WORK_TYPE` | Bot mode | `public` or `private` |
| `BOT_NAME` | Your bot name | `INCONNU BOY` |
| `IMAGE_PATH` | Bot profile image URL | `https://i.imgur.com/...` |
| `AUTO_VIEW_STATUS` | Auto view statuses | `false` |
| `ANTI_CALL` | Auto reject calls | `false` |

---

## 🟣 Deploy on Render (Recommended — Free)

### Steps

1. **Fork** this repo on GitHub

2. Go to [render.com](https://render.com) → **New** → **Web Service**

3. Connect your GitHub repo

4. Fill in the settings:
   ```
   Name:         inconnu-boy
   Environment:  Node
   Build Command: npm install
   Start Command: npm start
   ```

5. Add your **Environment Variables** (see table above)

6. Click **Deploy Web Service**

7. Once deployed, open your service URL:
   ```
   https://your-app.onrender.com/code?number=22890000000
   ```
   → You'll get a **pairing code** to enter in WhatsApp

### ⚠️ Render Free Tier Note
Render free services sleep after 15 minutes of inactivity. To keep your bot alive, use [UptimeRobot](https://uptimerobot.com) to ping your URL every 10 minutes.

---

## 🚂 Deploy on Railway (Easy — $5 free credits)

### Steps

1. **Fork** this repo on GitHub

2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**

3. Select your repo

4. Click **Variables** tab → Add all environment variables

5. Railway auto-detects Node.js and deploys automatically

6. Go to **Settings** → **Domains** → Generate a domain

7. Visit:
   ```
   https://your-app.railway.app/code?number=22890000000
   ```

### ✅ Railway Advantages
- No sleep on free tier (within credit limit)
- Auto-restart on crash
- Built-in logs

---

## 🟣 Deploy on Heroku

### Steps

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and login:
   ```bash
   heroku login
   ```

2. Clone your repo and enter the folder:
   ```bash
   git clone https://github.com/your-username/inconnu-boy
   cd inconnu-boy
   ```

3. Create a Heroku app:
   ```bash
   heroku create inconnu-boy-yourname
   ```

4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI="mongodb+srv://..."
   heroku config:set OWNER_NUMBER="22890000000"
   heroku config:set PREFIX="."
   heroku config:set WORK_TYPE="public"
   heroku config:set BOT_NAME="INCONNU BOY"
   heroku config:set IMAGE_PATH="https://your-image-url.jpg"
   ```

5. Deploy:
   ```bash
   git push heroku main
   ```

6. Open the pairing page:
   ```bash
   heroku open
   ```
   Or visit: `https://inconnu-boy-yourname.herokuapp.com/code?number=22890000000`

### ⚠️ Heroku Note
Heroku no longer has a free tier. Minimum is **Eco Dynos** at ~$5/month.

---

## 📱 Pair Your WhatsApp (All Platforms)

After deploying on any platform:

1. Open your app URL + `/code?number=YOUR_NUMBER`
   ```
   https://your-app.com/code?number=22890000000
   ```

2. You'll receive a **8-digit pairing code** like `ABCD-1234`

3. Open WhatsApp → **Linked Devices** → **Link a Device** → **Link with phone number instead**

4. Enter the pairing code

5. ✅ Your bot is now connected!

---

## 🔧 Useful API Endpoints

| Endpoint | Description |
|---|---|
| `/` | Pairing web page |
| `/code?number=xxx` | Generate pairing code |
| `/status` | Check all active connections |
| `/active` | List connected numbers |
| `/ping` | Check bot is running |
| `/disconnect?number=xxx` | Disconnect a number |
| `/stats?number=xxx` | View usage statistics |
| `/connect-all` | Reconnect all saved numbers |

---

## Bot Commands

| Command | Description |
|---|---|
| `.menu` | Show all commands by category |
| `.alive` | Check bot is alive |
| `.ping` | Check latency |
| `.antidelete on/off` | Enable anti-delete in group |
| `.anticall on/off` | Auto reject calls |
| `.autoviewstatus on/off` | Auto view statuses |
| `.autorecording on/off` | Show recording presence |
| `.autotyping on/off` | Show typing presence |
| `.readmessage on/off` | Auto read messages |
| `.kickall` | Kick all non-admin members |
| `.tagall [message]` | Mention all group members |

---

## 🐛 Common Issues

**`TypeError: makeInMemoryStore is not a function`**
→ Already fixed in this version. Make sure you're using this repo, not an old one.

**Bot connects but doesn't respond**
→ Check `WORK_TYPE` is set to `public`. Check `PREFIX` matches what you're typing.

**Pairing code fails**
→ Make sure your number format is correct (no `+`, no spaces). Example: `22890000000`

**MongoDB connection error**
→ Check your URI, and make sure your IP is whitelisted in Atlas (use `0.0.0.0/0` for cloud platforms).

**Bot disconnects frequently on Render**
→ Use UptimeRobot to ping `/ping` every 10 minutes.

---

## 📁 Project Structure

```
inconnu-boy/
├── index.js              # Express app entry point
├── inconnu.js            # Core bot logic & socket
├── inconnuboy.js         # Command loader
├── config.js             # Configuration
├── lib/
│   ├── database.js       # MongoDB models & functions
│   ├── antidelete.js     # Anti-delete handler
│   └── msg.js            # Message serializer
├── data/
│   └── Antidelete.js     # Antidelete MongoDB model
├── plugins/
│   ├── alive.js          # Ping & alive commands
│   ├── antidelete.js     # Antidelete command
│   ├── settings.js       # Settings commands
│   ├── group.js          # Group commands
│   └── menu.js           # Dynamic menu
└── pair.html             # Pairing web page
```

---

## 🤝 Contributing

Pull requests are welcome! To add a new command, create a file in `plugins/`:

```js
const { cmd } = require('../inconnuboy');

cmd({
    pattern: 'mycommand',
    desc: 'My command description',
    category: 'general',  // general | group | settings | owner | tools
    react: '✅'
}, async (conn, mek, m, { from, reply, isOwner }) => {
    reply('Hello from my command!');
});
```

It will **automatically appear in `.menu`** — no extra configuration needed.

---

---

## 👤 Credits & Author

| | |
|---|---|
| 👨‍💻 **Developer** | [INCONNU BOY](https://github.com/INCONNU-BOY) |
| 💻 **GitHub** | [github.com/INCONNU-BOY](https://github.com/INCONNU-BOY) |
| 📺 **WhatsApp Channel** | [Follow for updates & tutorials](https://whatsapp.com/channel/0029VbC6It7K0IBkQwaKYd2J) |
| 📦 **Library** | [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) |
| 🗄️ **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) |

> ⭐ If you use this project, please **star the repo** on GitHub and **follow the WhatsApp channel** for tutorials and updates — it helps a lot!

---

*© 2025 INCONNU BOY — Open Source WhatsApp Bot 🔥*  
*[github.com/INCONNU-BOY](https://github.com/INCONNU-BOY) • [WhatsApp Channel](https://whatsapp.com/channel/0029VbC6It7K0IBkQwaKYd2J)*
