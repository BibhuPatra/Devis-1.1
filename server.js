const express = require('express');
const connectDB = require('./config/db')
const cors = require('cors');
const app = express();

//conecct database
connectDB();

//init middleware
app.use(express.json({ extended: false }))
app.use(cors());

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});

app.get("/", (req, res) => {
    res.send('API Running')
})

app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/auth', require('./routes/api/auth'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running in port : ${PORT}`))