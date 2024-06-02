const session = require("express-session");
const cookieParser = require("cookie-parser");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 6789;

//Laborator 13.2
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Interval de timp pentru limitarea ratei (15 minute)
  max: 10, // Numarul maxim de cereri permise in intervalul de timp
  message: "Prea multe cereri de la această adresă IP. Încercați mai târziu.",
});

app.use(limiter);

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000,
    },
  })
);

// Laborator 13.3.a
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Interval de timp pentru limitarea ratei (1 minut)
  max: 3, // Numărul maxim de încercări nereușite permise în intervalul de timp
  message:
    "Prea multe încercări de autentificare nereușite. Încercați mai târziu.",
});

// Middleware pentru limitarea numărului de încercări nereușite de autentificare
app.post("/verificare-autentificare", authLimiter, (req, res) => {
  const { numeUtilizator } = req.body;

  // Simulați verificarea autentificării cu date dintr-un fișier JSON
  const rawUseri = fs.readFileSync("utilizatori.json");
  const listaUtilizatori = JSON.parse(rawUseri)["utilizatori"];

  const user = listaUtilizatori.find(
    (user) => user.utilizator === numeUtilizator
  );

  if (user) {
    if (user.parola === req.body.parola) {
      req.session.user = user;
      res.redirect("/");
    } else {
      res.status(401).send("Nume sau parolă invalidă!");
    }
  } else {
    res.status(401).send("Nume sau parolă invalidă!");
  }
});

// Middleware to set user in locals
function myMiddleware(req, res, next) {
  if (req.session.user) {
    res.locals.utilizator = req.session.user;
  } else {
    res.locals.utilizator = null;
  }
  next();
}

app.use("*", myMiddleware);

// Variable to store products from database
let listaProduse = [];

// Home route
app.get("/", (req, res) => {
  let db = new sqlite3.Database("cumparaturi.db", (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the SQLite database.");

    db.all("SELECT * FROM produse", (err, rows) => {
      if (err) {
        return console.error(err.message);
      }
      listaProduse = rows;
      res.render("index", { objects: listaProduse });

      db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log("Closed the database connection.");
      });
    });
  });
});

let rawIntrebari = fs.readFileSync("intrebari.json");
const listaIntrebari = JSON.parse(rawIntrebari)["intrebari"];

// Chestionar routes
app.get("/chestionar", (req, res) => {
  res.render("chestionar", { intrebari: listaIntrebari });
});

app.post("/rezultat-chestionar", (req, res) => {
  const solutions = req.body;
  let corecte = 0;
  for (let index = 0; index < listaIntrebari.length; index++) {
    const current = solutions["intrebare-" + index];
    if (current == listaIntrebari[index].corect) {
      corecte++;
    }
  }
  res.redirect("/rezultat-chestionar?corecte=" + corecte);
});

app.get("/rezultat-chestionar", (req, res) => {
  const total = listaIntrebari.length;
  const corecte = req.query.corecte;
  res.render("rezultat-chestionar", { total: total, rezultat: corecte });
});

// Autentificare routes
app.get("/autentificare", (req, res) => {
  let displayEroare = " ";
  if (req.session.user) {
    delete req.session.user;
  }
  if (req.cookies["mesajEroare"] !== null) {
    displayEroare = req.cookies["mesajEroare"];
  }
  res
    .clearCookie("mesajEroare")
    .render("autentificare", { displayError: displayEroare });
});

app.post("/verificare-autentificare", (req, res) => {
  const rawUseri = fs.readFileSync("utilizatori.json");
  const listaUtilizatori = JSON.parse(rawUseri)["utilizatori"];
  for (let i = 0; i < listaUtilizatori.length; ++i) {
    if (
      req.body.numeUtilizator == listaUtilizatori[i].utilizator &&
      req.body.parola == listaUtilizatori[i].parola
    ) {
      req.session.user = listaUtilizatori[i];
      delete req.session.user.parola;
      res.clearCookie("mesajEroare");
      res.redirect("/");
      return;
    }
  }
  res.cookie("mesajEroare", "Nume sau parolă invalidă!");
  res.redirect("autentificare");
});

// Baze de date routes
app.get("/creare-bd", (req, res) => {
  let db = new sqlite3.Database("cumparaturi.db", (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the SQLite database.");

    db.run(
      `
       CREATE TABLE IF NOT EXISTS produse (
         id INTEGER PRIMARY KEY,
         nume TEXT,
         pret REAL,
         src_img TEXT
       )
     `,
      (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Table "produse" created.');

        db.close((err) => {
          if (err) {
            return console.error(err.message);
          }
          console.log("Closed the database connection.");
        });
      }
    );
  });
  res.redirect("/");
});

app.get("/inserare-bd", (req, res) => {
  let db = new sqlite3.Database("cumparaturi.db", (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the SQLite database.");

    const objectsToInsert = [
      { nume: "Placă de bază GIGABYTE", pret: 700, src_img: "placadebaza.png" },
      { nume: "Placă video OEM Nvidia", pret: 850, src_img: "placavideo.png" },
      { nume: "Placă sunet", pret: 350, src_img: "placasunet.png" },
      { nume: "Răcire CPU", pret: 250, src_img: "racireCPU.png" },
      { nume: "Placă I/O", pret: 100, src_img: "placaio.png" },
    ];

    objectsToInsert.forEach((obj) => {
      db.run(
        "INSERT INTO produse (nume, pret, src_img) VALUES (?, ?, ?)",
        [obj.nume, obj.pret, obj.src_img],
        function (err) {
          if (err) {
            return console.error(err.message);
          }
          console.log(`Inserted object with ID ${this.lastID}`);
        }
      );
    });

    db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Closed the database connection.");
    });
  });

  res.redirect("/");
});

// Cumparaturi routes
let savedObjectIDs = [];

app.post("/adauga-cos", (req, res) => {
  const idProdus = req.body.id;
  console.log(idProdus);

  savedObjectIDs.push(idProdus);
  console.log(savedObjectIDs);

  if (idProdus) {
    if (!req.session.cosCumparaturi) req.session.cosCumparaturi = [];

    let exist = false;

    req.session.cosCumparaturi.forEach((produsCos) => {
      if (
        produsCos.id == idProdus &&
        produsCos.numeUtilizator == req.session.user.utilizator
      ) {
        produsCos.nrProduse++;
        exist = true;
        return;
      }
    });

    if (!exist) {
      req.session.cosCumparaturi.push({
        numeUtilizator: req.session.user.utilizator,
        id: idProdus,
        nrProduse: 1,
      });
    }
  }
  console.log(req.session.cosCumparaturi);
  res.redirect("/");
});

app.get("/vizualizare-cos", (req, res) => {
  const produseCos = [];
  if (req.session.cosCumparaturi && req.session.cosCumparaturi.length > 0) {
    req.session.cosCumparaturi.forEach((produs) => {
      if (produs.numeUtilizator == req.session.user.utilizator) {
        const item = listaProduse.find((item) => item.id == produs.id);
        item.nrProduse = produs.nrProduse;
        produseCos.push(item);
      }
    });
  }
  res.render("vizualizare-cos", { objects: produseCos });
});

// Admin routes
app.get("/admin", (req, res) => {
  if (req.session.user && req.session.user.rol === "ADMIN") {
    res.render("admin");
  } else {
    res.redirect("/autentificare");
  }
});

app.post("/adauga-produs", (req, res) => {
  if (req.session.user && req.session.user.rol === "ADMIN") {
    const { nume, pret, src_img } = req.body;
    let db = new sqlite3.Database("cumparaturi.db", (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Connected to the SQLite database.");
      db.run(
        "INSERT INTO produse (nume, pret, src_img) VALUES (?, ?, ?)",
        [nume, pret, src_img],
        function (err) {
          if (err) {
            return console.error(err.message);
          }
          console.log(`Inserted new product with ID ${this.lastID}`);

          // Refresh listaProduse after inserting new product
          db.all("SELECT * FROM produse", (err, rows) => {
            if (err) {
              return console.error(err.message);
            }
            listaProduse = rows;
          });

          db.close((err) => {
            if (err) {
              return console.error(err.message);
            }
            console.log("Closed the database connection.");
          });
        }
      );
    });
    res.redirect("/admin");
  } else {
    res.redirect("/autentificare");
  }
});

app.listen(port, () =>
  console.log(`Serverul rulează la adresa http://localhost:${port}`)
);
