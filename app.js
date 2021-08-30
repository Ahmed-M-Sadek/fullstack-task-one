const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const Blog = require("./models/blog");
const axios = require("axios").default;

require("dotenv").config();

// express app
const app = express();

// connect to mongodb & listen for requests

mongoose
  .connect(process.env.DBURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => app.listen(process.env.PORT))
  .catch((err) => console.log(err));

// register view engine
app.set("view engine", "ejs");

// middleware & static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// routes
app.get("/", (req, res) => {
  res.redirect("/blogs");
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});

// blog routes
app.get("/blogs/create", (req, res) => {
  res.render("create", { title: "Create a new blog" });
});

app.get("/blogs", (req, res) => {
  Blog.find()
    .sort({ createdAt: -1 })
    .then((result) => {
      res.render("index", { blogs: result, title: "All blogs" });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/blogs", (req, res) => {
  // console.log(req.body);
  const blog = new Blog(req.body);

  blog
    .save()
    .then((result) => {
      res.redirect("/blogs");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/blogs/:id", (req, res) => {
  const id = req.params.id;
  Blog.findById(id)
    .then((result) => {
      res.render("details", { blog: result, title: "Blog Details" });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.delete("/blogs/:id", (req, res) => {
  const id = req.params.id;

  Blog.findByIdAndDelete(id)
    .then((result) => {
      res.json({ redirect: "/blogs" });
    })
    .catch((err) => {
      console.log(err);
    });
});

// API page
app.get("/population", async (req, res) => {
  const countries = {
    Egypt: 0,
    China: 0,
    Japan: 0,
    Russia: 0,
    India: 0,
    Brazil: 0,
  };
  for (const item in countries) {
    const options = {
      method: "GET",
      url: process.env.APIURLPOP,
      params: { country_name: item },
      headers: {
        "x-rapidapi-host": process.env.APIHOST,
        "x-rapidapi-key": process.env.APIKEY,
      },
    };
    const response = await axios.request(options);
    countries[item] = response.data.body.population;
  }
  res.render("population", { title: "Countries", list: countries });
});

// 404 page
app.use((req, res) => {
  res.status(404).render("404", { title: "404" });
});
