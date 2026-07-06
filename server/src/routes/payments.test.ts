import { calculateCheckoutTotals } from './payments';

describe('calculateCheckoutTotals', () => {
  it('computes subtotal, shipping, and total correctly', () => {
    const totals = calculateCheckoutTotals(1200, 2, true);

    expect(totals).toEqual({
      subtotal: 1200,
      shippingFee: 99,
      discountAmount: 0,
      finalPayableAmount: 1299,
    });
  });

  it('avoids shipping fee when cart is empty', () => {
    const totals = calculateCheckoutTotals(0, 0, false);

    expect(totals).toEqual({
      subtotal: 0,
      shippingFee: 0,
      discountAmount: 0,
      finalPayableAmount: 0,
    });
  });
});
