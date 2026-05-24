/**
 * Error thrown when a dependency cycle is detected.
 */
export class CycleError extends Error {
  constructor(public readonly cycle: string[]) {
    super(formatCycleError(cycle));
    this.name = 'CycleError';
  }
}

/**
 * Format a cycle error message.
 */
function formatCycleError(cycle: string[]): string {
  return `Dependency cycle detected:\n  ${cycle.join(' → ')}\n\nHint: Check if any features or services depend on each other in a circular way.`;
}
