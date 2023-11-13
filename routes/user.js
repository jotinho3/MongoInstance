const express = require('express');
const router = express.Router(); //routing importing and usage
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  // Generate a salt and hash the password
  const saltRounds = 10;

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword, // Store the hashed password
    },
  });

res.status(201).json(`Parabéns ${(user.name).replace(/\/"/g, '')}, seu usuário criado com sucesso! `);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Compare the provided password with the stored hashed password
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({ message: 'Login successful' });
});

module.exports = router;
