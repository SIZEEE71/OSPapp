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


