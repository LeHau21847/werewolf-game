const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  side: { 
    type: String, 
    enum: ['VILLAGER', 'WEREWOLF', 'THIRD_PARTY'], 
    required: true 
  },
  logicKey: { type: String, required: true }, // e.g., 'SEER', 'WITCH', 'WOLF'
  description: String,
  uiEffects: {
    type: [String],
    default: []
  },
  logicCodeHint: String
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
