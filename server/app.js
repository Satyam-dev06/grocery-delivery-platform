const express = require("express");

const cors = require("cors");

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", function(req, res){

    res.send("🚀 Grocery Delivery Backend Running");

});

const PORT = 5000;

app.listen(PORT, function(){

    console.log(`Server Running on Port ${PORT}`);

});