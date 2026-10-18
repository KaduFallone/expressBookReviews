const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => users.some(u => u.username === username);
const authenticatedUser = (username, password) =>
  users.some(u => u.username === username && u.password === password);

regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Informe usuário e senha" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Usuário ou senha inválidos" });
  }
  const accessToken = jwt.sign({ data: password }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: "Login realizado com sucesso" });
});

regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!books[isbn]) return res.status(404).json({ message: "Livro não encontrado" });
  if (!review) return res.status(400).json({ message: "Informe a resenha em ?review=" });

  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: `Resenha do livro ${isbn} adicionada/atualizada para o usuário ${username}`,
    reviews: books[isbn].reviews
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) return res.status(404).json({ message: "Livro não encontrado" });
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: "Você não tem resenha para este livro" });
  }
  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Resenha do livro ${isbn} excluída para o usuário ${username}`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;