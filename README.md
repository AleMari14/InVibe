# 🎉 InVibe - Piattaforma per Eventi Sociali

**InVibe** è una piattaforma moderna e intuitiva per la creazione, scoperta e partecipazione a eventi sociali. Connetti persone con interessi simili e crea esperienze memorabili nella tua città.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/alemari14s-projects/v0-in-vibe)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/JarUY47lEPt)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🚀 Demo Live

**Prova l'app:** [https://v0-in-vibe.vercel.app](https://v0-in-vibe.vercel.app)

## ✨ Caratteristiche Principali

### 🎯 **Gestione Eventi**
- **Creazione eventi** con wizard guidato step-by-step
- **Geolocalizzazione** integrata con Google Maps
- **Upload immagini** ottimizzato con Cloudinary
- **Filtri avanzati** per categoria, data, prezzo e località
- **Sistema di prenotazioni** con gestione posti disponibili

### 👥 **Social Features**
- **Autenticazione** sicura con NextAuth.js (Google OAuth)
- **Profili utente** personalizzabili con statistiche
- **Sistema di messaggi** in tempo reale
- **Lista preferiti** per salvare eventi interessanti
- **Sistema di recensioni** e valutazioni

### 🎨 **UI/UX Moderna**
- **Design responsive** ottimizzato per mobile
- **Dark/Light mode** con persistenza delle preferenze
- **Animazioni fluide** con Framer Motion
- **Componenti shadcn/ui** per consistenza visiva
- **PWA ready** per installazione su dispositivi

### 🔧 **Funzionalità Avanzate**
- **Notifiche push** per aggiornamenti eventi
- **Chat in tempo reale** tra organizzatori e partecipanti
- **Sistema di achievements** per gamification
- **Ottimizzazione immagini** automatica
- **SEO ottimizzato** per migliore visibilità

## 🛠️ Stack Tecnologico

### **Frontend**
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Type safety e developer experience
- **Tailwind CSS** - Styling utility-first
- **shadcn/ui** - Componenti UI moderni
- **Framer Motion** - Animazioni e transizioni
- **React Hook Form** - Gestione form performante

### **Backend**
- **Next.js API Routes** - Serverless functions
- **NextAuth.js** - Autenticazione completa
- **MongoDB Atlas** - Database NoSQL cloud
- **Cloudinary** - Gestione e ottimizzazione media
- **Google Maps API** - Servizi di geolocalizzazione

### **Deployment & DevOps**
- **Vercel** - Hosting e deployment automatico
- **MongoDB Atlas** - Database cloud gestito
- **Cloudinary** - CDN per media assets
- **GitHub** - Version control e CI/CD

## 📦 Installazione e Setup

### **Prerequisiti**
- Node.js 18+ 
- npm o yarn
- Account MongoDB Atlas
- Account Google Cloud (per OAuth e Maps)
- Account Cloudinary

### **1. Clone del Repository**
\`\`\`bash
git clone https://github.com/your-username/invibe.git
cd invibe
npm install
\`\`\`

### **2. Configurazione Environment Variables**
Crea un file `.env.local` nella root del progetto:

\`\`\`env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invibe

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL_INTERNAL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# WebSocket (opzionale per sviluppo locale)
NEXT_PUBLIC_WS_URL=ws://localhost:3001
PORT=3000
\`\`\`

### **3. Setup Database**
\`\`\`bash
# Avvia il server di sviluppo
npm run dev

# Visita http://localhost:3000/api/test-db per testare la connessione
\`\`\`

### **4. Avvio Applicazione**
\`\`\`bash
# Sviluppo
npm run dev

# Build di produzione
npm run build
npm start

# Linting e type checking
npm run lint
npm run type-check
\`\`\`

## 🗂️ Struttura del Progetto

\`\`\`
invibe/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticazione
│   │   ├── events/               # Gestione eventi
│   │   ├── messages/             # Sistema messaggi
│   │   ├── notifications/        # Notifiche
│   │   └── upload/               # Upload file
│   ├── auth/                     # Pagine autenticazione
│   ├── evento/[id]/              # Dettaglio evento
│   ├── crea-evento/              # Creazione evento
│   ├── messaggi/                 # Chat e messaggi
│   ├── profile/                  # Profilo utente
│   └── globals.css               # Stili globali
├── components/                   # Componenti React
│   ├── ui/                       # Componenti base (shadcn/ui)
│   ├── chat/                     # Componenti chat
│   ├── event/                    # Componenti eventi
│   └── profile/                  # Componenti profilo
├── lib/                          # Utilities e configurazioni
│   ├── auth.ts                   # Configurazione NextAuth
│   ├── mongodb.ts                # Connessione database
│   ├── cloudinary.ts             # Configurazione Cloudinary
│   └── utils.ts                  # Utility functions
├── hooks/                        # Custom React hooks
├── types/                        # Definizioni TypeScript
├── public/                       # Asset statici
└── middleware.ts                 # Middleware Next.js
\`\`\`

## 🔐 Configurazione Servizi

### **MongoDB Atlas**
1. Crea un cluster su [MongoDB Atlas](https://cloud.mongodb.com)
2. Configura le regole di accesso IP
3. Crea un database user
4. Ottieni la connection string

### **Google Cloud Console**
1. Crea un progetto su [Google Cloud Console](https://console.cloud.google.com)
2. Abilita Google+ API e Maps JavaScript API
3. Configura OAuth 2.0 credentials
4. Aggiungi domini autorizzati

### **Cloudinary**
1. Registrati su [Cloudinary](https://cloudinary.com)
2. Ottieni le credenziali dal dashboard
3. Configura upload presets (opzionale)

## 🚀 Deployment su Vercel

### **Deploy Automatico**
1. Connetti il repository GitHub a Vercel
2. Configura le environment variables nel dashboard Vercel
3. Il deploy avviene automaticamente ad ogni push

### **Deploy Manuale**
\`\`\`bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

## 📱 Funzionalità Dettagliate

### **Sistema di Autenticazione**
- Login/Registrazione con Google OAuth
- Gestione sessioni sicure con NextAuth.js
- Protezione route con middleware
- Profili utente personalizzabili

### **Gestione Eventi**
- Wizard di creazione guidato
- Upload multiplo immagini
- Integrazione Google Maps per località
- Sistema di categorie e tag
- Gestione posti disponibili e prenotazioni

### **Chat e Messaggi**
- Messaggi in tempo reale
- Notifiche per nuovi messaggi
- Chat tra organizzatori e partecipanti
- Cronologia messaggi persistente

### **Sistema di Notifiche**
- Notifiche push per browser
- Email notifications (configurabile)
- Notifiche in-app per eventi
- Gestione preferenze utente

## 🎯 Roadmap e Funzionalità Future

### **In Sviluppo**
- [ ] **Pagamenti integrati** con Stripe
- [ ] **App mobile** React Native
- [ ] **Sistema di recensioni** avanzato
- [ ] **Integrazione social media** sharing
- [ ] **Analytics dashboard** per organizzatori

### **Pianificate**
- [ ] **Supporto multilingua** (IT/EN)
- [ ] **Sistema di referral** e inviti
- [ ] **Integrazione calendario** (Google, Outlook)
- [ ] **Live streaming** eventi virtuali
- [ ] **Marketplace** per servizi eventi

## 🤝 Contribuire al Progetto

### **Come Contribuire**
1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

### **Guidelines**
- Segui le convenzioni di naming esistenti
- Aggiungi test per nuove funzionalità
- Aggiorna la documentazione se necessario
- Mantieni il codice pulito e commentato

## 🐛 Bug Report e Feature Request

Usa le [GitHub Issues](https://github.com/your-username/invibe/issues) per:
- Segnalare bug
- Richiedere nuove funzionalità
- Proporre miglioramenti
- Fare domande tecniche

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

## 👨‍💻 Autore

**Alessandro Mari**
- GitHub: [@alemari14](https://github.com/alemari14)
- LinkedIn: [Alessandro Mari](https://linkedin.com/in/alessandro-mari)
- Email: alessandro.mari@example.com

## 🙏 Ringraziamenti

- **v0.dev** per l'accelerazione dello sviluppo
- **Vercel** per l'hosting e deployment
- **shadcn/ui** per i componenti UI
- **Next.js team** per il framework eccezionale
- **Community open source** per le librerie utilizzate

---

**⭐ Se questo progetto ti è stato utile, lascia una stella su GitHub!**

**🚀 Inizia subito:** [Prova InVibe](https://v0-in-vibe.vercel.app)
