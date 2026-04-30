# Sineklik Fiyat Hesaplayici

Bu proje, sadece frontend ile calisan ve mobil APK'ya donusturulebilen bir siparis fiyat hesaplama ekranidir.

## Desteklenen Urunler

- Plise (normal ve ciftli senaryo)
- Surme
- Menteseli

## Hesaplama Kurallari

Olcu tipi eklemeleri:

- net = +0 cm
- kanat = +1 cm
- cita = +3 cm
- conta = +7 cm

Olculer mm olarak girilir, once cm'ye cevrilir, sonra ekleme uygulanir.

### 1) Plise

- Normal:
  - `(en_m + boy_m) * 2 * normal_price * quantity`
- Ciftli:
  - `isDouble=true` ve alan esigi saglanirsa
  - `floor(((en_cm * boy_cm * double_price) / double_divisor) * quantity / 10000)`

### 2) Surme

- `A = boy (cm)`
- `B = en (cm)`
- `x = A`
- `y = B/2` (veya kullanici ozel kanat genisligi girerse o deger)
- Birim fiyat:
  - `(A + B + x + y) * 2 * multiplier / 100`
- Toplam:
  - `unitPrice * quantity`

### 3) Menteseli

- Olcu tipi `menteseli_bitim` secilirse hesaplama icin en ve boya +5 cm eklenir.
- Birim fiyat:
  - `(genislik_m + yukseklik_m) * 2 * multiplier`
- Toplam:
  - `unitPrice * quantity`

## Gelistirme

```bash
npm install
npm run dev
```

## Web Build

```bash
npm run build
```

## APK Hazirlama (Android / Capacitor)

1. Web'i derle:

```bash
npm run build
```

2. Android projesine sync et:

```bash
npm run cap:sync
```

3. Android Studio ac:

```bash
npm run cap:open
```

4. Android Studio icinde **Build > Build APK(s)** ile APK al.

Alternatif terminal komutu (debug APK):

```bash
npm run apk:debug
```

Debug APK yolu:

- `android/app/build/outputs/apk/debug/app-debug.apk`
