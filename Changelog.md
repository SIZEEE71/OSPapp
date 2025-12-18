# Changelog

## [0.1.0] - 18.11.2025
### Dodano/zmieniono/poprawiono
- prosty server postawiony na oraclu,
- konfiguracja env, bazy danych, nasłuchu na port,
- testowanie połączeń z bazą danych, serverem na oraclu,
- konfiguracja firewall na OCI,
- na początku prosta lista dropdown do wybierania strażaków -> pobieranie GET z bazy danych,
- loading/error jezeli nie ma połączenia z bazą lub inny error,
- testowanie POST do bazy danych po kliknięciu ENTER,
- długie próby doboru kolorów do aplikacji, 
- globalny layout utwrzony w _layout.tsx,
- theme.ts do uzywania wspólnych kolorów,
- header.tsx został zmieniony na uzywanie samego _layout,
### TODO
- Dodanie przycisków na dole lub kafelków po wybraniu strażaka -> still dont know,
- sfinalizować wybór kolorów


## [0.2.0] - 26.11.2025
### Dodano/zmieniono/poprawiono
- dodano nowe tabele w bazie danych do obsługi wyposazenia strazakow
- poprawiono wyswietlanie i przesylanie ID strazaka zalogowanego
- dodano kafelki do ekranu glownego
- dobrano odpowiednie kolory
- dodano podstawowe(początki) wyposazenia strazakow
- dodano mozliwosc wprowadzania stanu wyposzaenia i ilosci
- dodano mozliwosc wprowadzenia notatek do wyposazenia
- wprowadzono route do wyposazenia oraz powrot
### TODO
- dodanie całego wyposazenia dla strazakow
- pasuje pewnie dodac tutaj cos ze naczelnik lub prezes lub konserwator ma opcje dodania lub podgladu wyposazenia samochodu, przegladow sprzetu itp


## [0.3.0] - 26.11.2025
- dodano mape do aplikacji
- dodano pokazywanie znacnzikow strazakow w ich lokalizacji
- dodano zczytywanie numeru telefonu do logowania
- dodano zczytywanie lokalizacji w celu wyswietlenia na mapach
- dodano wyszukiwanie adresu i rysowanie drogi do celu
- dodanie logowania za pomocą numeru telefonu
- dodano zoom na lokalizacje strazaka 

## [0.4.0] - 2.12.2025
- Dodano przycisk do włączania/wyłączania wyświetlania hydrantów
- Integracja z Overpass API (pobiera hydranty z OpenStreetMap)
- Hydranty wyświetlane w promieniu ~20km wokół Łososiny Dolnej
- Limit 500 hydrantów dla wydajności


## [0.5.0] - 2.12.2025
- System zarządzania pojazdami (CRUD operacje)
- System zarządzania sprzętem stacji (CRUD operacje)
- Backend zmieniony z hard fire_station_id FK na opcjonalne station_name (uniwersalna aplikacja dla każdej stacji)
- SafeAreaView do aplikacji (kompatybilność z Android/iOS notchami)
- Naprawiono błąd hydrantów z addDebug()

## [0.6.0] - 3.12.2025
### Android Back Button & UI Fixes
- Implementacja Android back button dla wszystkich ekranów (home, mapa, pojazdy-sprzet)
- Dwa poziomy back navigation: zamknięcie modali → powrót na poprzedni ekran
- Home screen blokuje back button (nie wraca do login page)
- Modal onRequestClose i onDismiss callbacks dla właściwego obsługiwania back buttona

### API & Data Fixes
- Zmiana API endpoints z fire_station_id na uniwersalne (bez parametrów)
- Usunięcie fire_station_id z POST requestów
- Fetching vehicles i equipment bez filtrowania po stacji
- Naprawiono wyświetlanie dodanych pojazdów i sprzętu

### Database
- Dodano nowe tabele do obsługi pojazdów, sprzętu, strazakow

### Strażacy page
- dodano wyswietlanie strazakow
- dodano dodawanie strazakow, usuwanie
- dodano wybor szkolen
- dodano wybor grupy dla strazaka

## [0.7.0] - 4,5,8.12.2025
### System Alarmów (Alarms)
- Nowa tabela `alarms` do przechowywania alarmów z polami: alarm_time, alarm_type, location, description, vehicle_id
- Nowa tabela `alarm_responses` do śledzenia odpowiedzi strażaków na alarmy (confirmed, arrival_time)
- Backend API endpoints

### System Załogi (Crew Assignment)
- Nowa tabela `alarm_crew` do przypisywania strażaków do konkretnych pozycji w wyjazdach
- Backend API endpoints
- Frontend alarmy.tsx:
  - Lista wszystkich alarmów z możliwością filtrowania
  - Modal do tworzenia nowych alarmów
  - Modal do edycji szczegółów alarmu
  - Sekcja załogi w detailsModal z wyświetlaniem przypisanych strażaków
  - Modal do przypisywania załogi z dynamicznym wyborem pozycji na podstawie max_people pojazdu:
    - Zawsze: Kierowca, Dowódca
    - Dodatkowo: Strażak 1, Strażak 2, ... (zależnie od pojazdu)
  - Przycisk do dodawania/usuwania członków załogi

### Statystyka (Statistics)
- Frontend statystyka.tsx z dwoma zakładkami:
  - **Po typach**: całkowita liczba wyjazdów + podział wg typów alarmów
  - **Strażacy**: ile razy każdy strażak był wpisywany w załogę alarmu
- Backend API endpoints
- Paski postępu do wizualizacji danych

### UI/UX Improvements
- Ustandaryzowanie przycisków w modalach (saveBtn, cancelBtn, deleteBtn)
- Dodanie SelectField do wyboru pojazdu z dropdown listy
- Przycisk "Statystyka" w headera alarmy.tsx do szybkiego dostępu do statystyk

### Bug Fixes
- Naprawiono błąd z Foreign Key (BIGINT vs INT)
- Naprawiono wyświetlanie map markerów z inicjałami imienia i nazwiska
- Naprawiono GROUP BY clause w SQL queries

### Config
- Dodanie nowych API endpoints do `app/config/api.ts`
- Migracja do systemem stylów - styles w osobnych plikach (`app/styles/`)

## [0.8.0] - 10-11.12.2025
### Powiadomienia (Notifications)
#### Backend (`src/routes/notifications.js`)
- Nowy API endpoint `GET /api/notifications/:firefighterId`
- Role-based notifications system:
  - **Wszyscy strażacy**: ostatnie 10 alarmów (przeszłe) + własne badania okresowe (`periodic_exam_until`)
  - **Naczelnik (rank 11)**: wszystkie powyższe + badania okresowe wszystkich strażaków
  - **Prezes (rank 12)**: wszystkie powyższe + przeglądy i ubezpieczenia pojazdów

#### Frontend (`app/powiadomienia.tsx`)
- Nowy ekran Powiadomienia z SectionList do organizacji danych po kategoriach
- 4 sekcje warunkowe:
  1. 📢 Przeszłe alarmy (wszyscy)
  2. 🏥 Moje badania okresowe (wszyscy)
  3. 🏥 Badania okresowe strażaków - Naczelnik (tylko Naczelnik+)
  4. 🚗 Pojazdy - przeglądy i ubezpieczenia - Prezes (tylko Prezes)
- Karty powiadomień z lewym obramowaniem kolorowanym wg pilności
- Wyświetlanie imienia i rangi zalogowanego strażaka
- Nawigacja do szczegółów (alarmy, pojazdy) z TouchableOpacity

#### Ustawienia (`app/ustawienia.tsx`)
- Implementacja AsyncStorage do persist settings
- Nowe handlery: `loadSettings()`, `saveSettings()`, permission request functions
- Obsługa permisji notifications i location
- Wibracja testowa przy włączaniu wibracji
- Reset settings z potwierdzeniem

### TODO
- Alarmowanie

## [0.9.0] - 15.12.2025
### Systemu Alarmowania (Call Detection & Notifications)
#### Native Module - CallDetectorModule.java
- Implementacja CallDetectorModule do monitorowania stanu telefonii
- `onHostResume()` - sprawdzenie intent alarmu przy wznowieniu aplikacji
- `checkIntentAlarm()` - RN bridge do sprawdzania alertu z widoku
- RINGING event emitowany do React Native'a z numerem i czasem

#### BroadcastReceiver - PhoneStateReceiver.java
- Nowy BroadcastReceiver do detekcji przychodzących połączeń
- Wysyłanie intent z alarm_triggered, phone_number, timestamp
- Flagi background: FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS, FLAG_ACTIVITY_NO_ANIMATION (nie pokazuje app na ekranie)

#### AlarmContext - Polling & State Management
- Polling system co 5 sekund szukający aktywnych alarmów na backendzie
- Automatyczne ładowanie alarmu jeśli brakuje incoming call (np. użytkownik bez zasięgu)
- `scheduleNotification()` - powiadomienie sticky bez dźwięku/wibracji
- `respondToAlarm()` - wysłanie odpowiedzi (TAK/NIE) i aktualizacja notificacji

#### Notification Handler (_layout.tsx)
- `setNotificationHandler` ustawiony na: shouldPlaySound=false, shouldSetBadge=false
- Wszystkie notyfikacje bezdźwięczne i bez badge'a

#### Alarmy.tsx
- Dodano wyświetlanie end_time w liście: "✓ Zakończono: [data godzina]"
- Formatowanie czasu lokalnego w liście


#### ActiveAlarmBanner.tsx
- Naprawiony timezone problem w `handleEndAlarm()`
- Wyświetlanie statystyk: TAK/NIE/Łącznie

### Mapa (Map Improvements)
#### Nearest Firefighters List
- Nowa sekcja na dole mapy "Najbliżsi strażacy" (sticky, left bottom)
- Haversine formula do obliczania odległości
- Wyświetlanie: Imię Nazwisko + odległość do remizy (w km)
- Sortowanie od najbliżej do remizy
- Top 3-4 strażaków
- Widoczne TYLKO podczas aktywnego alarmu

#### Map JavaScript Updates
- `updateNearestList()` funkcja z kalkulacją odległości
- `hasActiveAlarm` flag z React Native
- Dynamiczne ukrywanie listy gdy brak alarmu (display: none)

#### Filtering & Confirmed Firefighters
- Filtracja strażaków na mapie: jeśli alarm aktywny - pokaż TYLKO potwierdzonych (response_type='TAK')
- Jeśli brak alarmu - pokaż tylko zalogowanego użytkownika

### Architecture
- Alarm system obsługuje TRZY scenariusze:
  1. **A dostaje incoming call** → trigger alarm + widzi aktywny
  2. **B bez zasięgu** → polling znajduje alarm → widzi aktywny
  3. **C też dostaje incoming call** → debounce (7s) zapobiega duplikacji
- Wszystkie 3 osoby widzą "TRWAJĄCY ALARM" niezależnie od call detection

## [0.10.0] - 18.12.2025
### System Finansowy 
#### Strazacy.tsx - 
- Nowa zakładka "💰 Finanse" w widoku strażaków
- System zarządzania wydatkami i budżetem

#### Features
- **Podsumowanie finansowe**: karty pokazujące całkowite wydatki i budżet
- **Pasek postępu**: wizualizacja procentowego zużycia budżetu
- **Pozostały budżet**: dynamiczna kalkulacja (`budżet - wydatki`)
- **Dodawanie wydatków**: formularz z polami:
  - Opis wydatku
  - Kwota (zł)
  - Kategoria (Paliwo, Konserwacja, Części zamienne, Ubezpieczenie, Wyposażenie, Szkolenia, Inne)
  - Data
- **Usuwanie wydatków**: przycisk usuwania z potwierdzeniem
- **Raport wg kategorii**: agregacja wydatków po kategoriach
- **Lista wszystkich wydatków**: chronologiczny przegląd wszystkich wpisów
- **Zarządzanie budżetem**: pole do ustawienia rocznego budżetu

## [0.11.0] - 18.12.2025
### System Składek 
#### Database
  - `contributions_paid` (BOOLEAN) - czy opłacone
  - `contributions_paid_date` (DATE) - data opłacenia
  - `contributions_updated_at` (TIMESTAMP) - kiedy ostatnio zmieniono

#### Frontend - Strazacy.tsx
- Nowa zakładka "💳 Składki" w widoku strażaków
- Filtrowanie strażaków: Wszyscy / Nieopłacone / Opłacone
- Wyświetlanie statusu składek dla każdego strażaka:
  - ✓ Opłacone - z datą opłacenia
  - ⚠ Nieopłacone - jeśli nie zapłacone
- Modal do aktualizacji statusu składek:
  - Checkbox "Składki opłacone"
  - Pole daty opłacenia (widoczne gdy zaznaczone)
  - Przycisk Save/Anuluj

#### Backend - firefighters-extended.js
- Dodano `contributions_paid` i `contributions_paid_date` do:
  - Głównego GET (wszystkich strażaków)
  - PUT update endpoint
  - Wszystkie zapytania do bazy

#### Powiadomienia (Notifications)
- Backend: Nowa sekcja "💳 Nieopłacone składki"
  - Każdy strażak widzi swoje nieopłacone składki
  - Informacja: "Prosimy o opłacenie składek"
  - Żółty pasek po lewej stronie (urgency indicator)
  - Link do ekranu strażaków (składki)
- Frontend powiadomienia.tsx:
  - Nowa sekcja na liście powiadomień
  - Dynamiczna liczba nieopłaconych strażaków





