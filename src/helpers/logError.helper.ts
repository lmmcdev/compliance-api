import { InvocationContext } from '@azure/functions';

export function logErr(context: InvocationContext, err: unknown) {
  const msg =
    err instanceof Error
      ? (err.stack ?? err.message)
      : typeof err === 'string'
        ? err
        : JSON.stringify(err);
  context.error(msg);
}
