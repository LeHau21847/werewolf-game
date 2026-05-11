const Room = require('./werewolf-server/models/Room');
const { resolveNight } = require('./werewolf-server/gameEngine/NightResolver');

console.log('--- MA SÓI ULTIMATE: SIMULATOR UNIT TEST (SHOCK OVERDOSE) ---');

// 1. Initialize Room
const testRoom = new Room('room_alpha');

// 2. Setup Players
testRoom.addPlayer('wolf_1', 'Sói Xám', 'WOLF');
testRoom.addPlayer('guard_1', 'Bảo Vệ Mạnh', 'BODYGUARD');
testRoom.addPlayer('witch_1', 'Phù Thủy Trẻ', 'WITCH');
testRoom.addPlayer('player_a', 'Nạn Nhân (Player A)', 'VILLAGER');

// 3. Setup Night Actions Queue
// Scenario: Sói cắn A, Bảo vệ A, Phù thủy cứu A
const actions = [
  { actorId: 'wolf_1', targetId: 'player_a', type: 'WOLF' },
  { actorId: 'guard_1', targetId: 'player_a', type: 'BODYGUARD' },
  { actorId: 'witch_1', targetId: 'player_a', type: 'WITCH', skillType: 'HEAL' }
];

console.log('Scenario:');
console.log(' - Sói cắn Player A');
console.log(' - Bảo vệ Player A');
console.log(' - Phù thủy hồi sinh Player A');
console.log('-----------------------------------');

// 4. Run Resolver
resolveNight(testRoom, actions);

// 5. Check Result
const victim = testRoom.players['player_a'];

console.log(`Kết quả Player A:`);
console.log(` - Trạng thái: ${victim.isAlive ? 'CÒN SỐNG' : 'ĐÃ CHẾT'}`);
console.log(` - Lý do chết: ${victim.deathReason || 'N/A'}`);
console.log(` - Status Effects:`, JSON.stringify(victim.statusEffects));

// Verification
if (!victim.isAlive && victim.deathReason === 'SHOCK_OVERDOSE') {
  console.log('\n✅ TEST PASSED: Hệ thống đã xử lý chính xác kịch bản Sốc thuốc!');
} else {
  console.log('\n❌ TEST FAILED: Kết quả không như kỳ vọng.');
}
