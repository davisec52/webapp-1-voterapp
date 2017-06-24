const mongoose = require("mongoose");

let PollSchema = new mongoose.Schema({
	title: String,
	options: [
		{
			value: {
				type: String,
				required: true
			},
			count: {
				type: Number,
				required: false
			}
		}		
		],
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	voter: [
			{
				type: mongoose.Schema.Types.Mixed,
				ref: "User"
			}
		]
	
});

module.exports = mongoose.model("Poll", PollSchema);
