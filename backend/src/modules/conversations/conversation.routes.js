import { Router } from "express";

import {getAllConversations,getMessagesByConversation,markConversationAsRead,} from "./conversation.controller.js";

const router = Router();

// Get all conversations
router.get("/", getAllConversations);
router.get("/:conversationId/messages", getMessagesByConversation);
// Mark conversation as read
router.patch("/:conversationId/read", markConversationAsRead);

export default router;