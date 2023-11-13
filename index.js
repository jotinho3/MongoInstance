const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const userRouter = require('./routes/user'); //routing

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json()); 
app.use('/users', userRouter); //routing 
  
// Add a new endpoint to create a new user
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
