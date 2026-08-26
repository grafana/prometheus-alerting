import { canDeleteReceiver } from './ReceiverDrawer';

describe('canDeleteReceiver', () => {
  it('allows deletion only when mutation is allowed and the receiver is neither default nor in use', () => {
    expect(canDeleteReceiver(true, false, false)).toBe(true);
    expect(canDeleteReceiver(false, false, false)).toBe(false);
    expect(canDeleteReceiver(true, true, false)).toBe(false);
    expect(canDeleteReceiver(true, false, true)).toBe(false);
    expect(canDeleteReceiver(true, false, false, true)).toBe(false);
  });
});
