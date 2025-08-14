// logInfo.helper.ts

import { InvocationContext } from '@azure/functions';

export function logInfo(context: InvocationContext, message: string): void {
  context.log(message);
}
