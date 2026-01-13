# OSP Mobilny - Aplikacja do zarządzania Ochotniczą Strażą Pożarną

Mobilna aplikacja React Native / Expo do zarządzania operacjami i logistyką jednostki straży pożarnej.

## Funkcje

- Zarządzanie strażakami (CRUD, szkolenia, języki)
- System alarmowania (call detection, notyfikacje, mapa lokalizacji)
- Mapa z hydrantami i lokalizacją strażaków
- Zarządzanie pojazdami i sprzętem
- Raporty alarmów i statystyki
- System finansowy (wydatki, budżet)
- Śledzenie składek strażaków
- Powiadomienia

## Instrukcja instalacji

### Krok 1: Przygotowanie środowiska

#### 1.1 Instalacja Node.js
1. Wejdź na stronę https://nodejs.org
2. Pobierz wersję **LTS** (zalecana)
3. Zainstaluj Node.js (zaznacz opcję "Add to PATH")
4. Sprawdź instalację otwierając terminal/wiersz poleceń i wpisując:
   ```bash
   node --version
   npm --version
   ```

#### 1.2 Instalacja MySQL
1. Pobierz MySQL z https://dev.mysql.com/downloads/installer/
2. Zainstaluj MySQL Server (zapamiętaj hasło root!)

#### 1.3 Instalacja Android Studio (dla Android)
1. Pobierz z https://developer.android.com/studio
2. Zainstaluj Android Studio
3. Otwórz Android Studio i przejdź przez "Setup Wizard"
4. Zainstaluj Android SDK (API level 30 lub wyższy)
5. Utwórz emulator Android w AVD Manager lub podłącz telefon z włączonym "Debugowaniem USB"

### Krok 2: Pobranie i przygotowanie kodu

#### 2.1 Pobranie projektu
1. Pobierz cały projekt jako ZIP lub sklonuj repozytorium
2. Rozpakuj w wybranym folderze (np. `C:\OSP_Projekt`)

#### 2.2 Instalacja zależności aplikacji mobilnej
1. Otwórz terminal/wiersz poleceń
2. Przejdź do folderu aplikacji:
   ```bash
   cd ścieżka\do\projektu\OSP
   ```
3. Zainstaluj zależności:
   ```bash
   npm install
   ```

#### 2.3 Instalacja zależności serwera backend
1. Przejdź do folderu serwera:
   ```bash
   cd ..\OSP_APP_Server
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```

### Krok 3: Konfiguracja bazy danych

#### 3.1 Utworzenie bazy danych
1. Uruchom MySQL (lub otwórz MySQL Workbench)
2. Utwórz nową bazę danych:
   ```sql
   CREATE DATABASE osp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Zaimportuj strukturę i dane:
   ```bash
   mysql -u root -p osp_db < database_schema.sql
   ```

#### 3.2 Konfiguracja połączenia z bazą
1. W folderze serwera znajdź plik `src/db.js`
2. Sprawdź/ustaw dane połączenia:
   ```javascript
   const pool = mysql.createPool({
     host: 'localhost',
     user: 'root',
     password: 'TWOJE_HASŁO_MYSQL',
     database: 'osp_db'
   });
   ```

### Krok 4: Konfiguracja adresów API

#### 4.1 Sprawdzenie adresu IP komputera
1. Otwórz wiersz poleceń
2. Wpisz `ipconfig` (Windows) lub `ifconfig` (Mac/Linux)
3. Znajdź adres IP sieci lokalnej (np. 192.168.1.100)

#### 4.2 Aktualizacja konfiguracji API
1. Otwórz plik `OSP\app\config\api.ts`
2. Zmień adres API na adres IP swojego komputera:
   ```typescript
   const API_BASE_URL = 'http://192.168.1.100:4000/api'; // Twój adres IP
   ```

### Krok 5: Uruchomienie aplikacji

#### 5.1 Uruchomienie serwera backend
1. W terminalu przejdź do folderu serwera:
   ```bash
   cd OSP_APP_Server
   ```
2. Uruchom serwer:
   ```bash
   npm start
   ```
3. Sprawdź czy serwer działa - powinieneś zobaczyć: "Server running on port 4000"

#### 5.2 Uruchomienie aplikacji mobilnej

**Opcja A: Na emulatorze Android**
1. Uruchom emulator Android z Android Studio
2. W nowym terminalu przejdź do folderu aplikacji:
   ```bash
   cd OSP
   ```
3. Uruchom aplikację:
   ```bash
   npx expo run:android
   ```

**Opcja B: Na fizycznym telefonie**
1. Włącz "Debugowanie USB" w telefonie (Ustawienia → Informacje o telefonie → 7x naciśnij "Numer kompilacji" → Opcje programisty → Debugowanie USB)
2. Podłącz telefon do komputera
3. W terminalu:
   ```bash
   npx expo run:android
   ```

### Możliwe problemy i rozwiązania

#### Problem: Brak połączenia z bazą danych
**Rozwiązanie:** 
- Sprawdź czy MySQL jest uruchomiony
- Sprawdź dane logowania w `src/db.js`
- Sprawdź czy baza `osp_db` istnieje

#### Problem: Aplikacja nie łączy się z serwerem
**Rozwiązanie:**
- Sprawdź czy serwer działa (port 4000)
- Sprawdź adres IP w `app/config/api.ts`

#### Problem: Android build fail
**Rozwiązanie:**
- Sprawdź czy Android SDK jest zainstalowany
- Sprawdź zmienne środowiskowe ANDROID_HOME

### Pierwsze logowanie

Po uruchomieniu aplikacji:
1. Wybierz strażaka:
   - **Mateusz Pawłowski** 
   
W celu automatycznego logowania wymagane dodanie numeru telefonu podczas tworzenia własnego profilu, wtedy system automatyczne loguję na konto.

2. Możesz przetestować wszystkie funkcje aplikacji z przykładowymi danymi

## Wymagania techniczne

- **Node.js:** v18+ (zalecane v20+)
- **npm:** v8+
- **React Native/Expo:** SDK 50+
- **MySQL:** v8.0+
- **Android SDK:** API level 30+




