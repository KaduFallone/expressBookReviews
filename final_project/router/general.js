const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Informe usuário e senha" });
  }
  if (isValid(username)) {
    return res.status(409).json({ message: "Usuário já existe" });
  }
  users.push({ username, password });
  return res.status(201).json({ message: "Usuário registrado com sucesso. Agora você pode fazer login" });
});

const getBooks = () => new Promise((resolve) => resolve(books));

const findBooksBy = (field, value) =>
  new Promise((resolve, reject) => {
    const result = Object.values(books).filter(
      b => b[field].toLowerCase() === value.toLowerCase()
    );
    result.length ? resolve(result) : reject(new Error("Nenhum livro encontrado"));
  });

public_users.get('/', async (req, res) => {
  const allBooks = await getBooks();
  return res.status(200).send(JSON.stringify(allBooks, null, 4));
});

public_users.get('/isbn/:isbn', (req, res) => {
  new Promise((resolve, reject) => {
    const book = books[req.params.isbn];
    book ? resolve(book) : reject(new Error("Livro não encontrado"));
  })
    .then(book => res.status(200).json(book))
    .catch(err => res.status(404).json({ message: err.message }));
});

public_users.get('/author/:author', (req, res) => {
  findBooksBy("author", req.params.author)
    .then(result => res.status(200).json({ booksbyauthor: result }))
    .catch(err => res.status(404).json({ message: err.message }));
});

public_users.get('/title/:title', (req, res) => {
  findBooksBy("title", req.params.title)
    .then(result => res.status(200).json({ booksbytitle: result }))
    .catch(err => res.status(404).json({ message: err.message }));
});

public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Livro não encontrado" });
  return res.status(200).json(book.reviews);
});

const getAllBooks = async (callback) => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    if (callback) callback(null, response.data);
    else console.log(response.data);
  } catch (error) {
    if (callback) callback(error);
    else console.error("Erro ao buscar livros:", error.message);
  }
};

const getBookByISBN = (isbn) => {
  axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then(response => console.log(response.data))
    .catch(error => console.error("Erro ao buscar por ISBN:", error.message));
};

const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    console.log(response.data);
  } catch (error) {
    console.error("Erro ao buscar por autor:", error.message);
  }
};

const getBooksByTitle = (title) => {
  axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then(response => console.log(response.data))
    .catch(error => console.error("Erro ao buscar por título:", error.message));
};

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;