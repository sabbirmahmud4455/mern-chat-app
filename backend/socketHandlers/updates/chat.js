const { Model, model } = require("mongoose");
const Conversation = require("../../models/conversation");
const serverStore = require('../../serverStore');
const User = require('../../models/User');

const updateChatHistory = async (conversationId, toSpecifiedSocketId = null) => {
	const conversation = await Conversation.findById(conversationId).populate({
		path: 'messages',
		model: "Model",
		populate: {
			path: "author",
			model: User,
			select: 'username _id'
		}
	})

	if (conversation) {
		const io = serverStore.getSocketServerInstance();

		if (toSpecifiedSocketId) {
			// initial update of chat history
			return io.to(toSpecifiedSocketId).emit('direct-chat-history', {
				messages: conversation.messages,
				participants: conversation.participants,
			});
		}

		//check if users of this conversation are online 

		// if yes emit to them update

		conversation.participants.forEach(userId => {
			const activeConnections = serverStore.getActiveUsers(userId.toString());

			activeConnections.forEach(socketId => {
				io.to(socketId).emit('direct-chat-history', {
					messages: conversation.messages,
					participants: conversation.participants,
				});
			})
		});

	}
}

module.exports = {updateChatHistory}