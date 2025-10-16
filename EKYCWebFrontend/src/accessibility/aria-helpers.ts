export function ariaError(id: string, hasError: boolean) {
  return hasError ? { 'aria-describedby': id, 'aria-invalid': true } : {};
}
