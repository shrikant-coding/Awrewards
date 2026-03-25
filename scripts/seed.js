require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var is required for seeding.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function seed() {
  console.log('Seeding demo codes...');
  const codes = [
    { code: 'DEMO-LOW-0001', value: 50, tier: 'low', status: 'available' },
    { code: 'DEMO-MID-0001', value: 200, tier: 'mid', status: 'available' },
    { code: 'DEMO-HIGH-0001', value: 1000, tier: 'high', status: 'available' }
  ];

  for (const c of codes) {
    await db.collection('codes').add({ ...c, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }

  console.log('Seeding dailyPuzzle for today...');
  const dateKey = new Date().toISOString().slice(0,10);
  await db.collection('dailyPuzzles').doc(dateKey).set({
    crossword: { solution: 'HELLOWORLDMAGICODEXUNITY'.split('') },
    sudoku: { board: '1,0,0,4|0,3,2,0|0,4,1,0|2,0,0,3' },
    memory: { pairs: ['A','A','B','B','C','C','D','D'] }
  });

  console.log('Seeding rewards...');
  const rewards = [
    { name: '$5 Discount Code', description: 'Redeem for $5 off your next purchase', cost: 500, type: 'discount', value: 5, available: true },
    { name: '$10 Discount Code', description: 'Redeem for $10 off your next purchase', cost: 1000, type: 'discount', value: 10, available: true },
    { name: '$25 Discount Code', description: 'Redeem for $25 off your next purchase', cost: 2500, type: 'discount', value: 25, available: true },
    { name: 'Extra Boost', description: 'Get an additional boost for puzzles', cost: 200, type: 'feature', available: true },
    { name: 'Premium Puzzle Hint', description: 'Unlock advanced hints for all puzzles', cost: 300, type: 'feature', available: true }
  ];

  for (const r of rewards) {
    await db.collection('rewards').add({ ...r, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }

  console.log('Creating admin user...');
  // Note: Replace this with actual admin user setup
  // For now, we'll create a placeholder. In real usage, you would set a specific user as admin
  console.log('Admin setup: To make a user admin, update their document in Firestore with role: "admin"');

  console.log('Seed complete');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
