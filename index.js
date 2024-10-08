const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const validUrl = require("valid-url");
const cors = require("cors");

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const UrlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true, unique: true },
});

const UrlModel = mongoose.model("url", UrlSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/shorturl", async (req, res) => {
  const url = req.body.url;

  if (!validUrl.isWebUri(url)) {
    return res.json({ error: "invalid url" });
  }
  const existingUrl = await UrlModel.findOne({ original_url: url });
  if (existingUrl) {
    return res
      .status(200)
      .json({ original_url: url, short_url: existingUrl.short_url });
  }

  const urls = await UrlModel.find();
  const short_url = urls.length + 1;
  await UrlModel.create({ original_url: url, short_url });

  res.status(200).json({ original_url: url, short_url });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const { short_url } = req.params;

  const url = await UrlModel.findOne({ short_url });
  if (url) {
    res.redirect(url.original_url);
  } else {
    res.status(404).json({ error: "No short URL found for the given input" });
  }
});

app.get("/api/all-urls", async (req, res) => {
  const urls = await UrlModel.find();
  res.status(200).json(urls);
});

app.use((req, res) => {
  res.status(404).send("Route not found");
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to the db");
    app.listen(PORT, () => console.log("Server is listening on port " + PORT));
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

start();
