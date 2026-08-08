import { PrismaClient } from '@prisma/client';

// Credentials loaded from environment — never hardcode secrets in source files.
// Set these in your shell before running:
//   $env:SUPABASE_DATABASE_URL = "postgresql://..."
//   $env:DATABASE_URL = "postgresql://..."   (already set for Azure)
const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL;
const AZURE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL) {
  console.error('ERROR: SUPABASE_DATABASE_URL env var is not set. Aborting.');
  process.exit(1);
}
if (!AZURE_URL) {
  console.error('ERROR: DATABASE_URL env var is not set. Aborting.');
  process.exit(1);
}

const source = new PrismaClient({ datasources: { db: { url: SUPABASE_URL } } });
const target = new PrismaClient({ datasources: { db: { url: AZURE_URL } } });

const BATCH_SIZE = 100;

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function migrateTable<T extends Record<string, unknown>>(
  tableName: string,
  fetchFn: () => Promise<T[]>,
  insertFn: (batch: T[]) => Promise<{ count: number }>
): Promise<void> {
  log(`Migrating ${tableName}...`);
  const rows = await fetchFn();
  if (rows.length === 0) {
    log(`  ${tableName}: 0 rows — skipped`);
    return;
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await insertFn(batch);
    inserted += batch.length;
    process.stdout.write(`\r  ${tableName}: ${inserted}/${rows.length} rows...`);
  }
  console.log(`\r  OK ${tableName}: ${inserted} rows migrated`);
}

async function main() {
  log('=== VIEWORA: Supabase to Azure PostgreSQL Migration ===');
  log('');

  log('Testing connections...');
  await source.$connect();
  log('  Supabase connected');
  await target.$connect();
  log('  Azure connected');
  log('');

  log('Clearing existing data from Azure target...');
  await target.$executeRawUnsafe('TRUNCATE TABLE admin_activity_logs CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE page_views CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE payment_callback_logs CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE stock_reservations CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE refunds CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE payments CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE order_items CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE orders CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE referrals CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE coupons CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE otp_verifications CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE wishlist_items CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE cart_items CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE refresh_tokens CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE subscribers CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE addresses CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE users CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE product_collections CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE product_variants CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE products CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE collections CASCADE');
  await target.$executeRawUnsafe('TRUNCATE TABLE categories CASCADE');
  log('  Azure target cleared');
  log('');

  await migrateTable('categories', () => source.category.findMany(), (b) => target.category.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('collections', () => source.collection.findMany(), (b) => target.collection.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('products', () => source.product.findMany(), (b) => target.product.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('product_variants', () => source.productVariant.findMany(), (b) => target.productVariant.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('product_collections', () => source.productCollection.findMany(), (b) => target.productCollection.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('users', () => source.user.findMany(), (b) => target.user.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('addresses', () => source.address.findMany(), (b) => target.address.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('refresh_tokens', () => source.refreshToken.findMany(), (b) => target.refreshToken.createMany({ data: b, skipDuplicates: true }));

  const coupons = await source.coupon.findMany();
  if (coupons.length > 0) {
    log(`Migrating coupons (${coupons.length} rows) in 2 passes to handle circular FK...`);
    const pass1 = coupons.map(({ sourceOrderId: _omit, ...rest }) => rest);
    for (let i = 0; i < pass1.length; i += BATCH_SIZE) {
      await target.coupon.createMany({ data: pass1.slice(i, i + BATCH_SIZE), skipDuplicates: true });
    }
    log('  coupons pass 1 done');
  } else {
    log('  coupons: 0 rows skipped');
  }

  await migrateTable('orders', () => source.order.findMany(), (b) => target.order.createMany({ data: b, skipDuplicates: true }));

  if (coupons.length > 0) {
    const withSrc = coupons.filter((c) => c.sourceOrderId !== null);
    if (withSrc.length > 0) {
      log(`Patching ${withSrc.length} coupons sourceOrderId...`);
      for (const c of withSrc) {
        await target.coupon.update({ where: { id: c.id }, data: { sourceOrderId: c.sourceOrderId } });
      }
      log('  coupons.sourceOrderId patched');
    }
  }

  await migrateTable('order_items', () => source.orderItem.findMany(), (b) => target.orderItem.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('payments', () => source.payment.findMany(), (b) => target.payment.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('refunds', () => source.refund.findMany(), (b) => target.refund.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('stock_reservations', () => source.stockReservation.findMany(), (b) => target.stockReservation.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('payment_callback_logs', () => source.paymentCallbackLog.findMany(), (b) => target.paymentCallbackLog.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('cart_items', () => source.cartItem.findMany(), (b) => target.cartItem.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('wishlist_items', () => source.wishlistItem.findMany(), (b) => target.wishlistItem.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('subscribers', () => source.subscriber.findMany(), (b) => target.subscriber.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('otp_verifications', () => source.otpVerification.findMany(), (b) => target.otpVerification.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('referrals', () => source.referral.findMany(), (b) => target.referral.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('page_views', () => source.pageView.findMany(), (b) => target.pageView.createMany({ data: b, skipDuplicates: true }));
  await migrateTable('admin_activity_logs', () => source.adminActivityLog.findMany(), (b) => target.adminActivityLog.createMany({ data: b, skipDuplicates: true }));

  log('');
  log('=== VERIFICATION: Row count comparison ===');
  const checks: [string, Promise<number>, Promise<number>][] = [
    ['categories', source.category.count(), target.category.count()],
    ['collections', source.collection.count(), target.collection.count()],
    ['products', source.product.count(), target.product.count()],
    ['product_variants', source.productVariant.count(), target.productVariant.count()],
    ['product_collections', source.productCollection.count(), target.productCollection.count()],
    ['users', source.user.count(), target.user.count()],
    ['addresses', source.address.count(), target.address.count()],
    ['orders', source.order.count(), target.order.count()],
    ['order_items', source.orderItem.count(), target.orderItem.count()],
    ['payments', source.payment.count(), target.payment.count()],
    ['coupons', source.coupon.count(), target.coupon.count()],
    ['subscribers', source.subscriber.count(), target.subscriber.count()],
    ['referrals', source.referral.count(), target.referral.count()],
  ];

  let allMatch = true;
  for (const [name, srcP, tgtP] of checks) {
    const [s, t] = await Promise.all([srcP, tgtP]);
    const match = s === t;
    if (!match) allMatch = false;
    const icon = match ? 'OK' : 'MISMATCH';
    console.log(`  [${icon}] ${name.padEnd(25)} Supabase: ${String(s).padStart(5)}  Azure: ${String(t).padStart(5)}`);
  }

  log('');
  if (allMatch) {
    log('SUCCESS: All row counts match! Migration done. Safe to cut-over to Azure.');
  } else {
    log('FAILED: Row count mismatch. DO NOT cut-over. Investigate above.');
    process.exit(1);
  }

  await source.$disconnect();
  await target.$disconnect();
  log('Done.');
}

main().catch(async (e) => {
  console.error('Migration failed:', e);
  await source.$disconnect().catch(() => {});
  await target.$disconnect().catch(() => {});
  process.exit(1);
});