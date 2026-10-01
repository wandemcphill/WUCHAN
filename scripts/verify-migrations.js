const fs = require('fs');
const path = require('path');

function verifyMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  console.log(`Verifying ${files.length} SQL migration files...`);

  files.forEach((file) => {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    if (!content.trim()) {
      throw new Error(`Migration file ${file} is empty.`);
    }

    // Basic SQL syntax assertions
    const requiredKeywords = ['CREATE', 'TABLE', 'TYPE', 'ENUM', 'POLICY', 'ALTER'];
    const hasKeyword = requiredKeywords.some((kw) => content.includes(kw));

    if (!hasKeyword) {
      throw new Error(`Migration file ${file} does not contain valid SQL statements.`);
    }

    console.log(`  ✓ ${file} verified successfully.`);
  });

  const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
  if (fs.existsSync(seedPath)) {
    const seedContent = fs.readFileSync(seedPath, 'utf8');
    if (!seedContent.includes('INSERT INTO')) {
      throw new Error(`Seed SQL does not contain INSERT statements.`);
    }
    console.log(`  ✓ seed.sql verified successfully.`);
  }

  console.log('Migration verification complete!');
}

try {
  verifyMigrations();
} catch (err) {
  console.error('Migration verification failed:', err.message);
  process.exit(1);
}
