const mongoose = require("mongoose");
const NewsSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please Include the News name"],
  },
  discription: {
    type: String,
    required: [true, "Please Include the News Discription"],
  },
  image: {
    type: String,
    required: false,
  },
});
const News = mongoose.model("News", NewsSchema);
module.exports = News;
