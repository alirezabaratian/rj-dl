const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    _id: ObjectId,
    id: String,
    first_name: String,
    last_name: String,
    username: String,
    media: [{ type: ObjectId, ref: "Media" }],
  },
  { timestamps: true,
    versionKey: false
   }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
