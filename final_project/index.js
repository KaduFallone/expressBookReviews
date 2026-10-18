const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
app.use(express.json());

app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

app.use("/customer/auth/*", function auth(req, res, next) {
  if (req.session.authorization) {
    const token = req.session.authorization['accessToken'];
    jwt.verify(token, "access", (err, user) => {
      if (err) return res.status(403).json({ message: "Usuário não autenticado" });
      req.user = user;
      next();
    });
  } else {
    return res.status(403).json({ message: "Usuário não está logado" });
  }
});

const PORT = 5000;
app.use("/customer", customer_routes);
app.use("/", genl_routes);
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));