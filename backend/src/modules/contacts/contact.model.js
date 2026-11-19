
import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    default: "",
  },
  identifier: {
    type: String,
    required: true,
  },
  channel: {
    type: String,
    enum: ["whatsapp", "gmail", "slack"],
    required: true,
  },
  profilePicture: {
    type: String,
    default: "",
  },
}, { timestamps: true });

contactSchema.index(
  { userId: 1, channel: 1, identifier: 1 },
  { unique: true }
);


export default mongoose.model("Contact", contactSchema);
