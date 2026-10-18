const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Registrar novo usuário
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

// Lista de todos os livros da loja
public_users.get('/', async (req, res) => {
  const allBooks = await getBooks();
  return res.status(200).send(JSON.stringify(allBooks, null, 4));
});

// Detalhes do livro pelo ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  new Promise((resolve, reject) => {
    const book = books[req.params.isbn];
    book ? resolve(book) : reject(new Error("Livro não encontrado"));
  })
    .then(book => res.status(200).json(book))
    .catch(err => res.status(404).json({ message: err.message }));
});

// Livros pelo autor
public_users.get('/author/:author', (req, res) => {
  findBooksBy("author", req.params.author)
    .then(result => res.status(200).json({ booksbyauthor: result }))
    .catch(err => res.status(404).json({ message: err.message }));
});

// Livros pelo título
public_users.get('/title/:title', (req, res) => {
  findBooksBy("title", req.params.title)
    .then(result => res.status(200).json({ booksbytitle: result }))
    .catch(err => res.status(404).json({ message: err.message }));
});

// Resenhas do livro
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Livro não encontrado" });
  return res.status(200).json(book.reviews);
});

// ===== Axios: as mesmas consultas feitas com async/await e Promises =====

// Todos os livros: função async com callback, usando Axios
const getAllBooks = async (callback) => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    callback(null, response.data);
  } catch (error) {
    callback(error);
  }
};

// Livro pelo ISBN: Promise com Axios
const getBookByISBN = (isbn) =>
  axios.get(`${BASE_URL}/isbn/${isbn}`).then(response => response.data);

// Livros pelo autor: async/await com Axios
const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

// Livros pelo título: Promise com Axios
const getBooksByTitle = (title) =>
  axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`).then(response => response.data);

const sendAxiosError = (res, error) =>
  res.status(error.response ? error.response.status : 500)
    .json(error.response ? error.response.data : { message: error.message });

// Rotas que devolvem ao cliente o resultado das funções com Axios
public_users.get('/axios/books', (req, res) => {
  getAllBooks((error, allBooks) => {
    if (error) return sendAxiosError(res, error);
    return res.status(200).json(allBooks);
  });
});

public_users.get('/axios/isbn/:isbn', (req, res) => {
  getBookByISBN(req.params.isbn)
    .then(book => res.status(200).json(book))
    .catch(error => sendAxiosError(res, error));
});

public_users.get('/axios/author/:author', async (req, res) => {
  try {
    const result = await getBooksByAuthor(req.params.author);
    return res.status(200).json(result);
  } catch (error) {
    return sendAxiosError(res, error);
  }
});

public_users.get('/axios/title/:title', (req, res) => {
  getBooksByTitle(req.params.title)
    .then(result => res.status(200).json(result))
    .catch(error => sendAxiosError(res, error));
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;