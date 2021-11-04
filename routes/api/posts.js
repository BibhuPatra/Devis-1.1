const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

//@route    POST api/posts
//@desc     create a post
//@access   Private

router.post('/', [auth, [check('text', 'Text is required').notEmpty()]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });
        const post = await newPost.save();

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

//@route    POST api/posts
//@desc    get all post
//@access   Private

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

//@route    POST api/post/:post_id
//@desc    get particular post by id
//@access   Private

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post)
            return res.status(404).json({ msg: 'No post is available for the user' })

        res.json(post);
    } catch (err) {
        if (err.kind === 'ObjectId')
            return res.status(404).json({ msg: 'No post is available for the user' })
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

/////////////////////////////Delete Posts/////////////////////////


//@route    POST api/post/:post_id
//@desc     delete a post
//@access   Private

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post)
            return res.status(404).json({ msg: 'Post not found' })


        if (post.user.toString() != req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' })
        }
        await post.remove()

        res.json({ msg: 'Post deleted' });
    } catch (err) {
        if (!post)
            return res.status(404).json({ msg: 'No post is available for the user' })

        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

//@route    PUT api/post/like/:id
//@desc     like a post
//@access   Private

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //check id the post is alreasy been like 

        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post alreday liked' })
        }
        post.likes.unshift({ user: req.user.id });
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})


//@route    PUT api/post/unlike/:id
//@desc     unlike a post
//@access   Private

router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //check id the post has been been like 

        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not been liked' })
        }
        //get remove index 
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

//@route    POST api/post/commment
//@desc     coomment on  a post
//@access   Private

router.post('/comment/:id', [auth, [check('text', 'Text is required').notEmpty()]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(newComment);
        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})


//@route    DELETE api/post/commment/:id/:comment:id
//@desc     delete coomment on the post
//@access   Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //Pull out comment 
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        //make sure comment exist 
        if (!comment) {
            return res.status(404).json({ msg: 'Comment dose not exist' })
        }
        //check that user has commented or not
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' })
        }

        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        post.comments.splice(removeIndex, 1);
        await post.save();
        res.json(post.comments)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

module.exports = router;