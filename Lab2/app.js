const express = require('express')
const app = express()
const port = 3000
const path = require("path");

app.use("/static", express.static(path.join(__dirname, "public")));
app.use(
  "/scripts",
  express.static(path.join(__dirname + "/node_modules/leaflet/dist/"))
);

app.get('/', (req, res) => res.send('This is web and mobile gis course, lab2!'))
app.get('/lab2part1', (req, res) => res.sendFile(__dirname + '/lab2part1.html'))
app.listen(port, () => console.log(`Example app listening on port ${ port }!`))
