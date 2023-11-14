const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const { authenticateToken } = require('../middlewares/Auth'); 
const JWT_SECRET = 'c7c749e0e81c8da50a4d17c8ccbd54277b8c6526795d49a5a3ee109c32e69fb4a66d03b87d91f1d0d0b3d1996f85e5ff0b6a67152bf0a4a34debc78ce0cda4e';




router.get('/', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  res.status(201).json(`Parabéns ${(user.name).replace(/\/"/g, '')}, seu usuário criado com sucesso! `);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Create a JWT token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

  return res.json({ token });
});

router.get('/shops', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    // Retrieve shops owned by the current user
    const userShops = await prisma.shop.findMany({
      where: {
        userId: userId,
      },
    });

    res.status(200).json(userShops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/shops', authenticateToken, async (req, res) => {
  const { name, location } = req.body;
  const userId = req.user.userId; // Extract userId from the token

  try {
    const shop = await prisma.shop.create({
      data: {
        name,
        location,
        userId,
      },
    });

    // Create a new token with the shopId in the payload
    const tokenWithShopId = jwt.sign({ userId, shopId: shop.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ shop, token: tokenWithShopId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create shop' });
  }
});


router.get('/products',authenticateToken, async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

router.post('/products', authenticateToken, async (req, res) => {
  const { name, price, shopName } = req.body;
  const userId = req.user.userId;

  try {
    // Find the shop based on the shop name and user ID
    const shop = await prisma.shop.findFirst({
      where: {
        name: shopName,
        userId: userId,
      },
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Ensure that the found shop belongs to the user
    if (shop.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: Shop does not belong to the user' });
    }

    // Create the product with the found shop ID
    const product = await prisma.product.create({
      data: {
        name,
        price,
        shop: { connect: { id: shop.id } },
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



router.get('/products/:shopName', authenticateToken, async (req, res) => {
  const { shopName } = req.params;
  const userId = req.user.userId;

  try {
    // Find the shop based on the shop name and user ID
    const shop = await prisma.shop.findFirst({
      where: {
        name: shopName,
        userId: userId,
      },
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Retrieve products associated with the found shop
    const products = await prisma.product.findMany({
      where: {
        shopId: shop.id,
      },
    });

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



module.exports = router;