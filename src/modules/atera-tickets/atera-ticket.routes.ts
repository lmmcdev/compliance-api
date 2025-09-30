import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, created, parseJson } from '../../http';
import { CreateAteraTicketSchema } from './atera-ticket.dto';
import { AteraTicketService } from './atera-ticket.service';
import { BadRequestError } from '../../http/app-error';

async function createTicketHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  ctx.log('POST /v1/atera-tickets - Create Atera ticket');

  const body = await parseJson(req, CreateAteraTicketSchema);
  const service = new AteraTicketService();

  const result = await service.createTicket(body, ctx);

  if (!result.success) {
    throw new BadRequestError(
      result.error?.message || 'Failed to create Atera ticket',
      result.error?.details,
    );
  }

  return created(ctx, result.ticket);
}

// Register the route
app.http('createAteraTicket', {
  methods: ['POST'],
  route: 'v1/atera-tickets',
  handler: withHttp(createTicketHandler),
});