# 😂 Meme Savaşları

Arkadaşlarınla gerçek zamanlı oynanan eğlenceli bir meme partisi oyunu!

## Nasıl Oynanır?

1. **Oda Oluştur** – Bir oda oluştur ve kodu arkadaşlarınla paylaş (4–6 kişi)
2. **Katıl** – Arkadaşların koda girerek odaya katılır
3. **Oyna** – Her turda ekrana gelen komik/içten bir duruma en uygun meme'i seç
4. **Oyla** – Diğer oyuncuların meme'lerini oylayın
5. **Kazan** – En çok oy alan o turu kazanır; en fazla turu kazanan oyun galibidir!

---

## Kurulum & Çalıştırma

### Ön Koşullar
- [Node.js](https://nodejs.org/) v18 veya üstü

### 1. Bağımlılıkları Yükle

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Geliştirme Modunda Çalıştır

İki ayrı terminal aç:

**Terminal 1 – Sunucu:**
```bash
cd server
npm run dev
```

**Terminal 2 – İstemci:**
```bash
cd client
npm run dev
```

- Oyun: **http://localhost:5173**
- Sunucu API: **http://localhost:3001**
- Admin Paneli: **http://localhost:5173/admin** (Şifre: `admin123`)

---

## Proje Yapısı

```
MemeGame/
├── server/                 # Node.js + Express + Socket.io backend
│   ├── src/
│   │   ├── index.js        # Sunucu giriş noktası
│   │   ├── gameManager.js  # Oda & oyun durumu yönetimi
│   │   ├── socketHandlers.js # Socket olayları
│   │   ├── memeService.js  # Meme API entegrasyonu
│   │   ├── adminRoutes.js  # Admin REST API
│   │   └── data/
│   │       ├── prompts.json # Oyun metinleri (50 adet)
│   │       └── settings.json # Oyun ayarları
│   └── package.json
│
└── client/                 # React + Vite frontend
    ├── src/
    │   ├── App.jsx          # Ana state makinesi & socket bağlantısı
    │   ├── socket.js        # Socket.io istemcisi
    │   ├── index.css        # Tüm stiller (dark tema)
    │   └── components/
    │       ├── Home.jsx      # Ana sayfa
    │       ├── Lobby.jsx     # Bekleme odası
    │       ├── GamePhase.jsx # Meme seçim aşaması
    │       ├── VotingPhase.jsx # Oylama aşaması
    │       ├── RoundResults.jsx # Tur sonuçları
    │       ├── GameOver.jsx  # Oyun sonu
    │       ├── CountdownTimer.jsx # Geri sayım
    │       └── admin/        # Admin paneli
    │           ├── AdminApp.jsx
    │           ├── AdminLogin.jsx
    │           ├── AdminDashboard.jsx
    │           ├── PromptManager.jsx  # Metinleri yönet
    │           ├── GameSettings.jsx   # Oyun ayarları
    │           └── RoomsOverview.jsx  # Aktif odalar
    └── package.json
```

---

## Admin Paneli

`/admin` adresine git, varsayılan şifre: **admin123**

Admin panelinden yapabileceklerin:
- **📝 Metinler** — Oyun metinlerini ekle / düzenle / sil
- **⚙️ Ayarlar** — Tur sayısı, zamanlayıcılar, oyuncu limitleri vb.
- **🎮 Odalar** — Aktif odaları ve oyuncuları gerçek zamanlı izle
- **🔐 Şifre Değiştir** — Admin şifresini güncelle

---

## Meme API

Memeler [meme-api.com](https://meme-api.com) üzerinden çekiliyor. NSFW ve spoiler içerikler otomatik filtreleniyor. API erişilemezse placeholder görseller kullanılıyor.

---

## Oyun Ayarları (Varsayılan)

| Ayar | Değer |
|---|---|
| Tur sayısı | 5 |
| Meme gönderim süresi | 60 sn |
| Oylama süresi | 30 sn |
| Minimum oyuncu | 2 |
| Maksimum oyuncu | 6 |
| El büyüklüğü | 5 kart |
