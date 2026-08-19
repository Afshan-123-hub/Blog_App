const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  try {
    const { title, body, tag } = req.body;
    
    const post = new Post({
      title,
      body,
      tag: tag || 'general',
      author: req.user.name,
      authorId: req.user._id
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('-__v');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    const { title, body, tag } = req.body;
    post.title = title || post.title;
    post.body = body || post.body;
    post.tag = tag || post.tag;
    
    await post.save();

    res.json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.seedPosts = async (req, res) => {
  try {
    const seedPosts = [
      {
        title: 'Why a ledger is the right shape for a blog',
        body: 'Most blogs bury the order posts were written in behind a busy grid. A ledger keeps the sequence honest — entry one, then two, then three — and lets the writing carry the page instead of a hero image.\n\nThis is the seed post. Register an account and write your own to replace it in the running order.',
        tag: 'meta',
        author: 'ledger',
        authorId: req.user._id
      },
      {
        title: 'Setting up a local front-end environment',
        body: 'A minimal setup is enough to start: a code editor, a modern browser, and a way to serve static files locally so relative paths and fetch calls behave the way they will in production.\n\nNo build tools are required for a project like this one — plain HTML, CSS and JavaScript, opened straight in the browser.',
        tag: 'tooling',
        author: 'ledger',
        authorId: req.user._id
      }
    ];

    await Post.insertMany(seedPosts);

    res.json({
      success: true,
      message: 'Seed posts created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};