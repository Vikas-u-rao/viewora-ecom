import { PrismaClient } from '@prisma/client';

async function runQueriesFor(name: string, connectionString: string) {
  console.log(`\n======================================================`);
  console.log(`=== DATABASE: ${name} ===`);
  console.log(`======================================================`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });

  try {
    const notLikeCount: any = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) FROM products WHERE id NOT LIKE 'prod_%'`
    );
    const likeCount: any = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) FROM products WHERE id LIKE 'prod_%'`
    );
    const totalProducts = await prisma.product.count();

    console.log("Query 1: SELECT COUNT(*) FROM products WHERE id NOT LIKE 'prod_%':");
    console.log(notLikeCount);

    console.log("\nQuery 2: SELECT COUNT(*) FROM products WHERE id LIKE 'prod_%':");
    console.log(likeCount);

    console.log(`\nTotal Products: ${totalProducts}`);
  } catch (err: any) {
    console.error(`Error connecting to ${name}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const supabaseUrl =
    process.env.SUPABASE_DATABASE_URL ||
    '';
  const azureUrl =
    process.env.DATABASE_URL ||
    '';

  if (supabaseUrl) {
    await runQueriesFor('SUPABASE', supabaseUrl);
  } else {
    console.log('SUPABASE_DATABASE_URL is not set.');
  }

  if (azureUrl) {
    await runQueriesFor('AZURE (DATABASE_URL)', azureUrl);
  } else {
    console.log('DATABASE_URL is not set.');
  }

  process.exit(0);
}

main();
