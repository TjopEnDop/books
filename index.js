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

const apiURL = "https://openlibrary.org";
const coverApiURL = "https://covers.openlibrary.org/b/isbn/";
let genError = "";
let inputAuthor = "";
let inputISBN = "";

async function getBooks(){
  const result = await db.query("SELECT * FROM collection ORDER BY title ASC");
  const data = result.rows;
  return data;
}

async function getAuthor(req, resultISBN){
  if (resultISBN.authors[0].key) {
    console.log(`Author data (Pt 1): ${resultISBN.authors[0].key}`);
    console.log(`ISBN length: ${inputISBN.length}`);
    const searchAuthor = resultISBN.authors[0].key;
    const authorResponse =  await axios.get(apiURL + searchAuthor + ".json");
    const resultAuthor = authorResponse.data;
    return resultAuthor.name;
  }  
  if (resultISBN.contributors[2].name) {
    console.log(`Author data (Pt 1): ${resultISBN.contributors[2].name}`);
    console.log(`ISBN length: ${inputISBN.length}`);
    const searchAuthor = resultISBN.contributors[2].name;
    return searchAuthor;
  }
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
  // var split = i.isbn.replace(/-/g, '');
  inputISBN = req.body.isbn.replace(/-/g, '');
  console.log(`ISBN: ${inputISBN}`);

  const response = await axios.get(apiURL + "/isbn/" + inputISBN + ".json");
  const resultISBN = response.data;
  console.log(`ISBN data: ${resultISBN}`);
  const inputTitle = resultISBN.title;  
  console.log(`Title: ${inputTitle}`);

  const inputCover = coverApiURL + inputISBN + "-M.jpg";
  console.log(`Cover URL: ${inputCover}`);
  const inputRating = req.body.rating;
  console.log(`Rating: ${inputRating}`);
  const inputDate = req.body.date;
  console.log(`Date read: ${inputDate}`);
  const inputDesc = req.body.description;
  console.log(`Description: ${inputDesc}`);
  const inputNotes = req.body.notes;
  console.log(`Notes: ${inputNotes}`);
  try {
    inputAuthor = await getAuthor(req, resultISBN);
    console.log(`Author: ${inputAuthor}`);
            
    console.log(`Text between statements`);
    try{
      await db.query(
        "INSERT INTO collection (title, isbn, author, rating, date, description, notes, cover) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [inputTitle, inputISBN, inputAuthor, inputRating, inputDate, inputDesc, inputNotes, inputCover]
      );
      res.redirect("/");
    } catch(err){
      genError = err;
      res.redirect("/");
    }
    
  } catch (error) {
    console.error("Failed to make request:", error);
    genError = error;
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
