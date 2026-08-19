const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', postsController.getAllPosts);
router.get('/:id', postsController.getPost);

// Protected routes
router.post('/', auth, postsController.createPost);
router.get('/my/posts', auth, postsController.getMyPosts);
router.put('/:id', auth, postsController.updatePost);
router.delete('/:id', auth, postsController.deletePost);
router.post('/seed', auth, postsController.seedPosts);

module.exports = router;