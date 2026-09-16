const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

const mediaSchema = new Schema(
  {
    _id: ObjectId,
    url: String,
    type: String,
    user: { type: ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

const Media = mongoose.model("Media", mediaSchema);

module.exports = Media;
