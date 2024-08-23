const { PrismaClient } = require("@prisma/client");
const express = require("express");
const { auth, isOwner } = require("../middlewares/auth");
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
 * Create Post by Auth User
 */

router.post("/posts", auth, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ msg: "content requied" });
  }

  /**
   * get user from Localstorage
   */
  const user = res.locals.user;

  /**
   * Create Post
   */
  const post = await prisma.post.create({
    data: {
      content: content,
      userId: user.id,
    },
  });

  const data = await prisma.post.findUnique({
    where: {
      id: Number(post.id),
      include: {
        user: true,
        comments: {
          include: {
            user: true,
          },
        },
      },
    },
  });
  return res.json(data);
});

/**
 * Delete Post and related comments
 */

router.delete("/posts/:id", auth, isOwner("post"), async (req, res) => {
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

// ============= End Post Session ================= //

/**
 * Create Comments
 */

router.post("/comments", auth, async (req, res) => {
  const { content, postId } = req.body;

  if (!content || !postId) {
    return res.status(400).json({ msg: "content and PostId required" });
  }

  const user = res.locals.user;

  const comment = await prisma.comment.create({
    data: {
      content: content,
      userId: user.id,
      postId: postId,
    },
  });

  comment.user = user;

  res.json(comment);
});

/**
 * Delete comments
 */

router.delete("/comments/:id", auth, isOwner("comment"), async (req, res) => {
  const { id } = req.params;
  await prisma.comment.delete({
    where: {
      id: Number(id),
    },
  });
  res.sendStatus(204);
});

module.exports = { contentRouter: router };
