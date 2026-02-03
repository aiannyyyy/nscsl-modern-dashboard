// Migration script (run once)
const bcrypt = require('bcrypt');
const { database } = require('./config');
const db = database.mysqlPool;

async function migratePasswords() {
  const [users] = await db.query('SELECT user_id, password FROM user');
  
  for (const user of users) {
    // Check if password is already hashed (bcrypt hashes start with $2b$)
    if (!user.password.startsWith('$2b$')) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query('UPDATE user SET password = ? WHERE user_id = ?', 
        [hashedPassword, user.user_id]);
      console.log(`Migrated password for user_id: ${user.user_id}`);
    }
  }
  
  console.log('Password migration complete!');
}

migratePasswords();