# HTMLProject2

Acest proiect este o aplicație web dezvoltată folosind framework-ul Express.js, având ca scop principal gestionarea unui magazin online, cu funcționalități diverse, de la autentificare și autorizare, la administrarea produselor și vizualizarea coșului de cumpărături.

## Tehnologii și Module Utilizate
Express.js: Framework principal pentru dezvoltarea serverului.
express-session: Gestionarea sesiunilor de utilizator.
cookie-parser: Gestionarea și parsarea cookie-urilor.
express-ejs-layouts: Suport pentru EJS (Embedded JavaScript) și layout-uri.
body-parser: Parsarea datelor din corpul cererilor HTTP.
sqlite3: Conectarea și interacțiunea cu baza de date SQLite.
express-rate-limit: Limitarea ratei cererilor pentru protecția împotriva abuzurilor.

## Funcționalități Principale
### Autentificare și Autorizare:
Utilizatorii se pot autentifica folosind nume de utilizator și parolă stocate într-un fișier JSON (utilizatori.json).
Limitarea numărului de încercări de autentificare pentru a preveni atacurile de tip brute force.

### Gestionarea Produselor:
Produselor din baza de date SQLite li se pot crea, vizualiza și șterge în cadrul aplicației.
Adminii pot adăuga noi produse în baza de date prin intermediul unui formular.

### Coșul de Cumpărături:
Utilizatorii autentificați pot adăuga produse în coșul de cumpărături și vizualiza conținutul acestuia.

### Rate Limiting:
Limitarea numărului de cereri permise pentru a proteja serverul de cereri excesive și atacuri.

### Chestionar:
Un chestionar interactiv este disponibil, cu întrebări și răspunsuri stocate într-un fișier JSON (intrebari.json).


## Rute Importante
Autentificare: /autentificare, /verificare-autentificare
Produse: /, /creare-bd, /inserare-bd, /adauga-produs
Coș de Cumpărături: /adauga-cos, /vizualizare-cos
Chestionar: /chestionar, /rezultat-chestionar
Admin: /admin

## Configurația Bazei de Date
Baza de date SQLite este folosită pentru stocarea informațiilor despre produse.
Tabelul produse include coloane pentru id, nume, pret, și src_img.

## Middleware Personalizat
Middleware-ul myMiddleware adaugă informațiile despre utilizatorul autentificat în variabila locals pentru a fi accesibile în șabloane EJS.

## Lansare
Serverul rulează pe portul 6789 și poate fi accesat la adresa http://localhost:6789.

Această aplicație oferă o platformă robustă pentru gestionarea unui magazin online simplu, punând accent pe securitate prin limitarea ratelor cererilor și protecția împotriva atacurilor de tip brute force.
