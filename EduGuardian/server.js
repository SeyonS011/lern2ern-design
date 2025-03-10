
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`EduTrack app listening at http://0.0.0.0:${port}`);
});
