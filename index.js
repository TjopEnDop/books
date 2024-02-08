import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "*Tjoppie1992*",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const apiURL = "https://covers.openlibrary.org/b/isbn/";
let genError = "";

async function getBooks(){
  const result = await db.query("SELECT * FROM collection ORDER BY title ASC");
  const data = result.rows;
  // console.log(data);
  return data;
}

app.get("/", async (req, res) => {
  const books = await getBooks();
  res.render("index.ejs", {
    book: books,
    error: genError
  });
});

app.post("/", async (req, res) => {
  const books = await getBooks();
  res.render("index.ejs", {
    book: books,
    error: genError
  });
});

app.post("/add", async (req, res) => {
  const inputTitle = req.body.title;
  const inputISBN = req.body.isbn;
  const inputAuthor = req.body.author;
  const inputRating = req.body.rating;
  const inputDate = req.body.date;
  const inputDesc = req.body.description;
  const inputNotes = req.body.notes;

  try{
    await db.query(
      "INSERT INTO collection (title, isbn, author, rating, date, description, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [inputTitle, inputISBN, inputAuthor, inputRating, inputDate, inputDesc, inputNotes]
    );
    res.redirect("/");
  } catch(err){
    genError = err;
    res.redirect("/");
  }
});

app.post("/book", async (req, res) => {
  const bookID = req.body.view;
  const result = await db.query("SELECT * FROM collection WHERE id = $1", [bookID]);
  const data = result.rows[0];
  console.log(bookID);
  res.render("book.ejs", {
    book: data,
    error: genError
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
