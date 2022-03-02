const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: "Costumer not found" });
  }
  req.customer = customer;
  return next();
}

function getBalance(account) {
  const { statement } = account;

  const totalBalance = statement.reduce((sum, transaction) => {
    const { type, amount } = transaction;
    if (type === "credit") {
      return sum + amount;
    } else return sum - amount;
  }, 0);

  return totalBalance;
}

app.post("/account", (req, res) => {
  const { name, cpf } = req.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Custumer Already Exists" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return res.status(201).send();
});

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.get("/users", (req, res) => {
  const { cpf } = req.params;
  const customer = customers.find((customer) => customer.cpf === cpf);
  return res.json(customers);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };
  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "debit",
  };
  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;
  return res.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.status(201).send(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(200).send(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer);

  return res.json(balance);
});
app.listen(3333);
