import { OrderStatus, isValidOrderStatusTransition } from '@wuchan/contracts';

describe('Order State Machine Transition Validation', () => {
  it('allows valid state transitions', () => {
    expect(isValidOrderStatusTransition(OrderStatus.DRAFT, OrderStatus.QUOTED)).toBe(true);
    expect(isValidOrderStatusTransition(OrderStatus.QUOTED, OrderStatus.ACCEPTED)).toBe(true);
    expect(isValidOrderStatusTransition(OrderStatus.CONFIRMED, OrderStatus.ENGINEERING)).toBe(true);
    expect(isValidOrderStatusTransition(OrderStatus.PRODUCTION, OrderStatus.QC)).toBe(true);
  });

  it('rejects invalid or illegal state jumps', () => {
    expect(isValidOrderStatusTransition(OrderStatus.DRAFT, OrderStatus.COMPLETED)).toBe(false);
    expect(isValidOrderStatusTransition(OrderStatus.DRAFT, OrderStatus.DELIVERED)).toBe(false);
    expect(isValidOrderStatusTransition(OrderStatus.PRODUCTION, OrderStatus.DELIVERED)).toBe(false);
    expect(isValidOrderStatusTransition(OrderStatus.CANCELLED, OrderStatus.PRODUCTION)).toBe(false);
  });

  it('allows same status no-op transition', () => {
    expect(isValidOrderStatusTransition(OrderStatus.CONFIRMED, OrderStatus.CONFIRMED)).toBe(true);
  });
});
