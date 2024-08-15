const { PrismaClient } = require("@prisma/client");

const express = require("express");
const router = express.Router();
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
/**
 * Get All User
 */
router.get("/users", async (req, res) => {
  try {
    const data = await prisma.user.findMany({
      include: {
        posts: true,
        comments: true,
      },
      orderBy: {
        id: "desc",
      },
      take: 20,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/**
 * Get User by id
 */

router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.user.findFirst({
      where: {
        id: Number(id),
      },
      include: {
        posts: true,
        comments: true,
      },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/**
 * Create New User
 */

router.post("/users", async (req, res) => {
  const { name, username, password, bio } = req.body;

  if (!name || !password || !username) {
    return res.status(400).json("Name, Password and Bio are required");
  }

  const hashpass = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      username,
      password: hashpass,
      bio,
    },
  });

  res.json({ data: user, message: "Created success" });
});

module.exports = { UserRouter: router };
