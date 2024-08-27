const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { auth } = require("../middlewares/auth");
const prisma = require("../prismaClient");

/**
 * User Login
 */

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: "username and password required" });
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (user) {
    if (bcrypt.compare(password, user.password)) {
      const token = jwt.sign(user, process.env.JWT_SECRET);
      return res.json({ token, user });
    }
  }

  res.status(401).json({ msg: "incorrect username or password" });
});

/**
 * Get All User
 */
router.get("/users", async (req, res) => {
  try {
    const data = await prisma.user.findMany({
      include: {
        posts: true,
        comments: true,
        followers: true,
        following: true,
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
        followers: true,
        following: true,
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
  const { name, username, bio, password } = req.body;

  if (!name || !username || !password) {
    return res
      .status(400)
      .json({ msg: "name, username and password required" });
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hash,
        bio,
      },
    });

    res.json(user);
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

/**
 * Follow User
 */

router.post("/follow/:id", auth, async (req, res) => {
  const { id } = req.params;
  const user = res.locals.user;

  const data = await prisma.follow.create({
    data: {
      followerId: Number(user.id),
      followingId: Number(id),
    },
  });
  if (data.ok) {
    res.json(data);
  }
});

/**
 * Delete Follow User
 */

router.delete("/follow/:id", auth, async (req, res) => {
  const { id } = req.params;
  const user = res.locals.user;

  await prisma.follow.deleteMany({
    where: {
      followerId: Number(user.id),
      followingId: Number(id),
    },
  });

  res.json({ msg: `Unfollow user ${id}` });
});

/**
 * Search
 */

router.get("/search", auth, async (req, res) => {
  const { query } = req.query;
  const data = await prisma.user.findMany({
    where: {
      name: {
        contains: query,
      },
    },
    include: {
      followers: true,
      following: true,
    },
    take: 20,
  });
  res.json(data);
});

module.exports = { userRouter: router };
