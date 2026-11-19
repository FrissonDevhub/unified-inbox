
import mongoose from "mongoose";

const whatsappSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    phoneNumberId: {
      type: String,
      required: true,
      unique: true,
    },

    businessAccountId: {
      type: String,
      required: true,
    },

    accessToken: {
      type: String,
      required: true,
    },

    displayPhoneNumber: {
      type: String,
      default: "",
    },

    verifiedName: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("WhatsAppAccount", whatsappSchema);
