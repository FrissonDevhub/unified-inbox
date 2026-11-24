import Conversation from "./conversation.model.js";
import mongoose from "mongoose";
import Message from "../messages/message.model.js";



export async function getAllConversations(req, res) {
  try {
    const { channel } = req.query;

    // Pagination values
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const userId = "6afd33afa8620f4c287a3d98";

    const filter = {
      userId,
    };

    if (channel) {
      filter.channel = channel;
    }

    // Total conversations matching the filter
    const total = await Conversation.countDocuments(filter);

    // Fetch paginated conversations
    const conversations = await Conversation.find(filter)
      .populate("contactId", "name identifier profilePicture")
      .sort({ lastMessageAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      conversations,
    });

  } catch (error) {
    console.error("Get Conversations Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}











export async function getMessagesByConversation(req, res) {
  try {
    const { conversationId } = req.params;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    // Pagination values
    const page = Math.max(1, Number(req.query.page) || 1); //tells which page required by frontend 
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20)); // tells how much message need in one page 

    const skip = (page - 1) * limit; //tells how much message skp from database 

    // Temporary development user ID
    const userId = "6afd33afa8620f4c287a3d98";

    // Check whether conversation exists
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
      channel: "whatsapp",
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Fetch total messages count
    const total = await Message.countDocuments({  //coun
      conversationId,
      userId,
      channel: "whatsapp",
    });

    // Fetch paginated messages
    const messages = await Message.find({
      conversationId,
      userId,
      channel: "whatsapp",
    })
      .sort({ timestamp: -1 }) //-1 means decending order 
      .skip(skip)
      .limit(limit);

    // Reverse to show oldest first within the selected page
    messages.reverse();  // for showing oldest to newest message 

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),  //covert decimal to next whole number 
        hasNextPage: page * limit < total,   //1 * 20 < 150 result true that means page is avilable
        hasPreviousPage: page > 1,
      },
      messages,
    });

  } catch (error) {
    console.error("Get Messages Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


export async function markConversationAsRead(req, res) {
  try {
    const { conversationId } = req.params;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    // Temporary development user ID
    const userId = "";

    // Check conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
      channel: "whatsapp",
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Mark incoming messages as read
    await Message.updateMany(
      {    //conditions
        conversationId,
        userId,
        channel: "whatsapp",
        direction: "inbound",
        status: "received",
      },
      {
        $set: {
          status: "read",
        },
      }
    );

    // Reset unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        unreadCount: 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read",
    });

  } catch (error) {
    console.error("Mark as Read Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}








