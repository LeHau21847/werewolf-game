const mongoose = require('mongoose');
const Role = require('../models/Role');

const MONGO_URI = 'mongodb://localhost:27017/werewolf_db';

const roles = [
  // PHE DÂN LÀNG
  {
    name: 'Dân thường',
    side: 'VILLAGER',
    logicKey: 'VILLAGER',
    description: 'Không có chức năng đặc biệt, chỉ tham gia thảo luận và vote.',
    uiEffects: ['Avatar đơn giản', 'tông màu sáng']
  },
  {
    name: 'Tiên tri (Seer)',
    side: 'VILLAGER',
    logicKey: 'SEER',
    description: 'Mỗi đêm chọn 1 ID người chơi để Server trả về kết quả "Sói" hoặc "Dân".',
    uiEffects: ['Hiệu ứng quả cầu pha lê tỏa sáng khi soi']
  },
  {
    name: 'Phù thủy (Witch)',
    side: 'VILLAGER',
    logicKey: 'WITCH',
    description: 'Có 2 biến hasHeal và hasPoison. Có quyền cứu người chết trong đêm hoặc giết 1 người.',
    uiEffects: ['2 chai thuốc (Xanh/Tím) lấp lánh']
  },
  {
    name: 'Bảo vệ (Bodyguard)',
    side: 'VILLAGER',
    logicKey: 'BODYGUARD',
    description: 'Chọn 1 ID để bảo vệ. Người này sẽ không chết nếu bị Sói cắn đêm đó.',
    uiEffects: ['Hiệu ứng khiên chắn (Shield)']
  },
  {
    name: 'Thợ săn (Hunter)',
    side: 'VILLAGER',
    logicKey: 'HUNTER',
    description: 'Nếu chết, được kích hoạt phát bắn để kéo 1 người chết theo.',
    uiEffects: ['Hiệu ứng tâm ngắm và tiếng súng nổ']
  },
  {
    name: 'Thần tình yêu (Cupid)',
    side: 'VILLAGER',
    logicKey: 'CUPID',
    description: 'Đêm đầu chọn 2 ID để gán linkedID. Nếu 1 người chết, người kia chết theo.',
    uiEffects: ['Mũi tên trái tim nối 2 Avatar']
  },
  {
    name: 'Già làng (Elder)',
    side: 'VILLAGER',
    logicKey: 'ELDER',
    description: 'Có 2 mạng. Nếu bị dân làng treo cổ, mọi người mất hết chức năng.',
    uiEffects: ['Hiệu ứng gậy chống', 'viền vàng cổ điển']
  },
  {
    name: 'Thị trưởng (Mayor)',
    side: 'VILLAGER',
    logicKey: 'MAYOR',
    description: 'Phiếu bầu của người này tính là 2 phiếu khi biểu quyết treo cổ.',
    uiEffects: ['Biểu tượng huy hiệu vàng trên Avatar']
  },
  {
    name: 'Hiệp sĩ (Knight)',
    side: 'VILLAGER',
    logicKey: 'KNIGHT',
    description: 'Mỗi đêm chọn 1 người. Nếu là Sói, Sói chết. Nếu là Dân, Hiệp sĩ chết.',
    uiEffects: ['Hiệu ứng kiếm bạc chém ngang màn hình']
  },
  {
    name: 'Pháp sư (Spellcaster)',
    side: 'VILLAGER',
    logicKey: 'SPELLCASTER',
    description: 'Chọn 1 người để "khóa mõm" (Mute) trong ngày hôm sau.',
    uiEffects: ['Hiệu ứng khóa kéo trên miệng Avatar']
  },

  // PHE MA SÓI
  {
    name: 'Sói thường',
    side: 'WEREWOLF',
    logicKey: 'WOLF',
    description: 'Cùng phe Sói biểu quyết chọn 1 ID dân làng để giết mỗi đêm.',
    uiEffects: ['Mắt sói đỏ rực trong bóng tối']
  },
  {
    name: 'Sói con (Wolf Cub)',
    side: 'WEREWOLF',
    logicKey: 'WOLF_CUB',
    description: 'Nếu Sói con chết, đêm tiếp theo phe Sói được chọn giết 2 người.',
    uiEffects: ['Hiệu ứng tiếng hú nhỏ', 'màn hình rung lắc']
  },
  {
    name: 'Sói trắng (White Wolf)',
    side: 'WEREWOLF',
    logicKey: 'WHITE_WOLF',
    description: 'Mỗi 2 đêm được quyền giết thêm 1 con Sói khác để trở thành kẻ duy nhất.',
    uiEffects: ['Bộ lông trắng tuyết', 'sương mù lạnh lẽo']
  },
  {
    name: 'Sói tiên tri (Mystic Wolf)',
    side: 'WEREWOLF',
    logicKey: 'MYSTIC_WOLF',
    description: 'Mỗi đêm soi một người để tìm các chức năng quan trọng của dân.',
    uiEffects: ['Mắt sói tỏa hào quang tím huyền bí']
  },

  // PHE THỨ 3
  {
    name: 'Kẻ chán đời (Tanner)',
    side: 'THIRD_PARTY',
    logicKey: 'TANNER',
    description: 'Chỉ thắng khi bị treo cổ vào ban ngày.',
    uiEffects: ['Dây thòng lọng', 'nhân vật cười tươi']
  },
  {
    name: 'Kẻ thổi sáo (Piper)',
    side: 'THIRD_PARTY',
    logicKey: 'PIPER',
    description: 'Mỗi đêm chọn 2 người để charm. Khi tất cả người sống đều bị charm, Piper thắng.',
    uiEffects: ['Nốt nhạc bay lơ lửng quanh Avatar']
  },
  {
    name: 'Sát thủ (Serial Killer)',
    side: 'THIRD_PARTY',
    logicKey: 'SERIAL_KILLER',
    description: 'Mỗi đêm giết 1 người bất kể phe nào. Mục tiêu là người sống sót cuối cùng.',
    uiEffects: ['Vết máu loang trên màn hình']
  },
  {
    name: 'Nửa người nửa sói',
    side: 'THIRD_PARTY',
    logicKey: 'WILD_CHILD',
    description: 'Chọn 1 "Thần tượng". Nếu thần tượng chết, đổi phe từ Dân sang Sói.',
    uiEffects: ['Hiệu ứng biến hình (Transform)']
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');
    
    await Role.deleteMany({}); // Xóa cũ nếu có để tránh trùng lặp khi chạy lại
    await Role.insertMany(roles);
    
    console.log('Successfully seeded 18 roles!');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
