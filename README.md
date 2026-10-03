# manifest kaset rafı

**Canlı site:** https://furkancelik95.github.io/manifest-bmo/

manifest'in klipleri raflarda kaset olarak duruyor. Bir kasete tıklayınca kaset BMO'nun yuvasına giriyor ve klip BMO'nun ekranında oynuyor.

## Kontroller

| BMO'da | Klavyede | Ne yapar |
| --- | --- | --- |
| Ekrana tıkla / mavi üçgen | Boşluk | Oynat / duraklat |
| Sarı tuş ◀ ▶ | ← → | Önceki / sonraki kaset |
| Sarı tuş ▲ ▼ | ↑ ↓ | Sesi aç / kıs |
| Yeşil tuş | | Karışık bir kaset tak |
| Kırmızı tuş | Esc | Kaseti çıkar |
| Ekranın altındaki çubuk | | Klipte ileri / geri sar |

Klip bitince sıradaki kaset kendiliğinden takılır.

## Yerelde çalıştırma

YouTube klipleri dosya doğrudan açılınca oynamaz, sayfanın bir sunucudan açılması gerekir:

```
python -m http.server 8000
```

Sonra http://localhost:8000 adresini aç. Windows'ta `baslat.bat`'a çift tıklamak da aynı işi yapar.

## Dosyalar

- `index.html`: sayfa
- `style.css`: BMO, kasetler ve raflar (tamamen CSS ile çizildi)
- `app.js`: kaset listesi (YouTube ID'leri) ve oynatıcı; YouTube IFrame API kullanır

Yeni bir klip eklemek için `app.js` içindeki `TAPES` listesine bir satır eklemen yeterli.

---

Created by Furkan Enes Çelik. Hayran işi; klipler manifest'in YouTube kanallarından oynar, BMO Adventure Time'dan.
