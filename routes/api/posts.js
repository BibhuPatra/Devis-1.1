const express = require('express');
const router = express.Router();

//@route    GET api/posts
//@desc     Test rout
//@access   public

router.get('/', (req, res) => {
    res.send("post Routes")
})

module.exports = router;