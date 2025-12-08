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


