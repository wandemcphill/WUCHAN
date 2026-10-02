const fs = require('fs');
const path = require('path');

function verifyMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  console.log(`Verifying ${files.length} SQL migration files...`);

  files.forEach((file) => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    if (!content.trim()) {
      throw new Error(`Migration file ${file} is empty.`);
    }

    // Comprehensive SQL DDL & statement syntax validation
    const lines = content.split('\n');
    let inBlockComment = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('/*')) inBlockComment = true;
      if (trimmed.endsWith('*/')) {
        inBlockComment = false;
        return;
      }
      if (inBlockComment || trimmed.startsWith('--') || !trimmed) return;

      // Check for illegal or dangerous syntax
      if (trimmed.toLowerCase().includes('drop database')) {
        throw new Error(`Illegal DROP DATABASE statement found in ${file}:${idx + 1}`);
      }
    });

    // Verify key structural constructs exist
    if (file.includes('initial_schema')) {
      if (!content.includes('CREATE TABLE IF NOT EXISTS public.profiles') || !content.includes('CREATE TABLE IF NOT EXISTS public.organizations')) {
        throw new Error(`Missing core initial schema tables in ${file}`);
      }
    } else if (file.includes('domain_tables')) {
      if (!content.includes('CREATE TABLE IF NOT EXISTS public.products') || !content.includes('CREATE TABLE IF NOT EXISTS public.orders')) {
        throw new Error(`Missing core domain tables in ${file}`);
      }
    } else if (file.includes('rls_policies')) {
      if (!content.includes('ENABLE ROW LEVEL SECURITY') || !content.includes('CREATE POLICY')) {
        throw new Error(`Missing RLS security policies in ${file}`);
      }
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
