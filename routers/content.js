const { PrismaClient } = require("@prisma/client");
const express = require("express");
const router = express.Router();

const prisma = new PrismaClient();

/**
 * Get All Posts
 */

router.get("/posts", async (req, res) => {
  try {
    const data = await prisma.post.findMany({
      include: {
        user: true,
        comments: true,
      },
      orderBy: { id: "desc" },
      take: 20,
    });

    res.json(data);
    // setTimeout(() => {
    // }, 3000);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

/**
 * Get by Id
 */

router.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await prisma.post.findFirst({
      where: { id: Number(id) },
      include: {
        user: true,
        comments: {
          include: {
            user: true,
          },
        },
      },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

/**
 * Delete Post and related comments
 */

router.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;

  /**
   * first delete comments
   */
  await prisma.comment.deleteMany({
    where: { postId: Number(id) },
  });

  /**
   * then delete posts
   */

  await prisma.post.delete({
    where: {
      id: Number(id),
    },
  });

  res.sendStatus(204);
});

router.delete("/comments/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.comment.delete({
    where: {
      id: Number(id),
    },
  });
  res.sendStatus(204);
});

module.exports = { contentRouter: router };
