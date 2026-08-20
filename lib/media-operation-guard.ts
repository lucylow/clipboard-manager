export function createMediaOperationGuard() {
  let active = false;

  return {
    acquire() {
      if (active) return false;
      active = true;
      return true;
    },
    release() {
      active = false;
    },
    get isActive() {
      return active;
    },
  };
}

export type MediaOperationGuard = ReturnType<typeof createMediaOperationGuard>;
