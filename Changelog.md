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
- Marker strażaka na emoji 👨‍🚒 (24px, bez skalowania z mapą)
- SafeAreaView do aplikacji (kompatybilność z Android/iOS notchami)
- Klik na marker strażaka otwiera popup z szczegółami
- Naprawiono błąd hydrantów z addDebug()

## [0.6.0] - 3.12.2025
### Android Back Button & UI Fixes
- Implementacja Android back button dla wszystkich ekranów (home, mapa, pojazdy-sprzet)
- Dwa poziomy back navigation: zamknięcie modali → powrót na poprzedni ekran
- Home screen blokuje back button (nie wraca do login page)
- Modal onRequestClose i onDismiss callbacks dla właściwego obsługiwania back buttona

### Modal Layout & Keyboard Fixes
- Usunięcie KeyboardAvoidingView (powodowała białe puste pola)
- Dodanie keyboardDismissMode="on-drag" dla zamykania klawiatury przez przesunięcie
- ScrollView contentContainerStyle paddingBottom (100px) zapobiega ukrywaniu zawartości
- modalActions z paddingBottom: insets.bottom + 15 dla bezpiecznej odległości od Android nav bar
- Buttons zawsze widoczne i dostępne, bez białych luk

### API & Data Fixes
- Zmiana API endpoints z fire_station_id na uniwersalne (bez parametrów)
- Usunięcie fire_station_id z POST requestów (wykorzystujemy opcjonalne station_name)
- Fetching vehicles i equipment bez filtrowania po stacji (multi-station universal architecture)
- Naprawiono wyświetlanie dodanych pojazdów i sprzętu

## [0.7.0] - 3.12.2025
### Strażacy (Firefighters) Management System - Complete Implementation
#### Database Schema (7 SQL Migrations)
- **`005_create_ranks_table.sql`**: 14 Polish OSP ranks across 3 categories (strażacy, zarząd, komisja)
- **`006_create_groups_table.sql`**: 4 group types (JOT, czynny, wspierający, brak)
- **`007_create_trainings_table.sql`**: 8 common trainings with validity_months tracking
- **`008_create_languages_table.sql`**: 8 languages (Polish, English, German, French, Russian, Ukrainian, Czech)
- **`009_create_firefighter_trainings_table.sql`**: Junction table for firefighter-training relationships
- **`010_create_firefighter_languages_table.sql`**: Junction table for firefighter-language relationships with proficiency levels
- **`011_alter_firefighters_table.sql`**: Extended firefighters table with 20+ new fields (surname, dates, addresses, personal data, etc.)

#### Backend Routers (4 New Endpoints)
- **`ranks.js`**: Complete CRUD for ranks (GET all, GET by id, POST create, PUT update, DELETE, with category filtering)
- **`groups.js`**: Simple CRUD for 4 group types (GET all, GET by id, POST, PUT, DELETE)
- **`trainings.js`**: Trainings CRUD + firefighter-training assignment endpoints (GET all, POST assign, DELETE remove training)
- **`languages.js`**: Languages CRUD + firefighter-language assignment endpoints (GET all, POST assign with proficiency level, DELETE remove)
- **`firefighters-extended.js`**: Extended firefighters router with:
  - GET all firefighters with filtering by group_id and rank_id
  - GET by id with full details (languages, trainings aggregated)
  - POST create with all 20+ fields
  - PUT update
  - DELETE (cascades to trainings and languages)
  - Specialized endpoints: /group/:groupId, /rank/:rankId
  - All endpoints aggregate related data (rank_name, group_name, languages, trainings joined as strings)

#### Frontend - Strażacy Page (`strażacy.tsx`)
- **List Tab**: Display all firefighters with filtering by group (Wszyscy, JOT, czynny, wspierający, brak)
  - List items show: surname, name, rank, periodic exam date
  - Click item to open details modal
- **Add Tab**: Comprehensive form with:
  - Personal data: imię, nazwisko, stopień (dropdown), grupa (dropdown), grupa krwi
  - Birth info: data urodzenia, miejsce urodzenia, imię ojca, PESEL
  - Membership: od kiedy członek OSP, opis, pobiera ekwiwalent (checkbox)
  - Contact: email, telefon
  - Address: miejscowość, ulica, nr domu
  - Periodic exam date, data processing consent (checkbox)
- **Details Modal**: Full firefighter information
  - All personal data fields displayed
  - List of assigned trainings
  - List of assigned languages with proficiency levels
  - Button to add training (opens Training Modal)
  - Button to add language (opens Language Modal)
  - Delete firefighter button
- **Training Modal**: Assign training to firefighter
  - Dropdown to select training
  - Date field for completion date
  - Auto-calculates validity_until based on training's validity_months
- **Language Modal**: Assign language to firefighter
  - Dropdown to select language
  - Proficiency level selector (basic, intermediate, advanced, fluent)

#### UI/UX Features
- Android back button support (close modal → go back)
- keyboardDismissMode="on-drag" for all scrollable modals
- Proper padding and safe area handling
- Filter buttons with visual feedback
- Loading states for data fetching
- Error alerts for failed operations
- Success confirmations for add/delete operations

#### API Routes Registered in Main App
- `/api/ranks` - ranks router
- `/api/groups` - groups router
- `/api/trainings` - trainings router
- `/api/languages` - languages router
- `/api/firefighters-extended` - extended firefighters router


