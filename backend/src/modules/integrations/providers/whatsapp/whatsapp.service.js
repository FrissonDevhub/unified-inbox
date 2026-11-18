import { getWhatsAppClient } from "./whatsapp.client.js";

import WhatsAppAccount from "./whatsapp.model.js";
import Contact from "../../../contacts/contact.model.js";
import Conversation from "../../../conversations/conversation.model.js";
import Message from "../../../messages/message.model.js";


export async function sendWhatsAppMessage({ to, body }) {
  const { accessToken, baseURL, phoneNumberId } = getWhatsAppClient();

  const response = await fetch(`${baseURL}/messages`, {
    method: "POST",

    headers: {   //send additional infor mation to api 
      Authorization: `Bearer ${accessToken}`,   // meta that our application is authorised
      "Content-Type": "application/json",  //tells api that we send json data 
    },

    body: JSON.stringify({      //use strinify because in fetch we should send data in string format 
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        body,
      },
    }),
  });

  const data = await response.json();


  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to send WhatsApp message");
  }

  return {
    success: true,
    messageId: data.messages?.[0]?.id,  // id got from meta
    data,
  };
}




export async function processIncomingWhatsAppMessage(message, metadata) {  //message is rreal message information from whatsapp  metadata WhatsApp Business account ki information.
  // 1. Find WhatsApp account
  // message	Customer ne kya message bheja
  // metadata	Kis WhatsApp Business number par message aaya
  const account = await WhatsAppAccount.findOne({
    phoneNumberId: metadata.phone_number_id,
    isActive: true,
  });

 




// const rawAccount = await WhatsAppAccount.collection.findOne({
//   phoneNumberId: metadata.phone_number_id,
// });



  if (!account) {
    throw new Error("WhatsApp account not found");
  }

  const userId = account.userId;


  // 2. Check duplicate message
  const existingMessage = await Message.findOne({
    userId,
    channel: "whatsapp",
    externalMessageId: message.id,
  });

  if (existingMessage) {
    return existingMessage;
  }

  // 3. Find or create contact
  const contact = await Contact.findOneAndUpdate(
    {
      userId,
      channel: "whatsapp",
      identifier: message.from,    //equals to customer phone number 
    },
    {
      $set: {  //update
        name: message.senderName || "",
      },
    },
    {
      new: true,  //return updated document
      upsert: true,  //means update+insert
      setDefaultsOnInsert: true,    //if new contact is created then we use defined default value
    }
  );

  // 4. Find or create conversation
  let conversation = await Conversation.findOne({
    userId,
    contactId: contact._id,
    channel: "whatsapp",
  });

  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      contactId: contact._id,
      channel: "whatsapp",
    });
  }

  // 5. Save incoming message
  const savedMessage = await Message.create({
    userId,
    conversationId: conversation._id,
    contactId: contact._id,
    channel: "whatsapp",
    externalMessageId: message.id,
    sender: message.from,
    text: message.text?.body ?? "",
    type: message.type,
    direction: "inbound",
    status: "received",
    timestamp: new Date(Number(message.timestamp) * 1000),
  });

  // 6. Update conversation
  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: {  //update the conversation existing field
      lastMessage: message.text?.body ?? `[${message.type}]`,
      lastMessageAt: savedMessage.timestamp,
    },
    $inc: {  //if message send then count increment 
      unreadCount: 1,
    },
  });

  return savedMessage;
}



export async function updateWhatsAppMessageStatus(statusData) {
  const updatedMessage = await Message.findOneAndUpdate(
    {
      channel: "whatsapp",
      externalMessageId: statusData.id,
    },
    {
      $set: {
        status: statusData.status,
      },
    },
    {
      new: true,  //after updating return new document 
    }
  );

  return updatedMessage;
}