import { InvocationContext } from '@azure/functions';
import { LogicAppClient } from '../../shared/logic-apps';
import { env } from '../../config/env';
import {
  CreateAteraTicketDto,
  CreateAteraTicketResult,
  AteraTicketResponse,
} from './atera-ticket.dto';

export class AteraTicketService {
  private logicAppClient: LogicAppClient;

  constructor() {
    

    this.logicAppClient = new LogicAppClient({
      url: env.ATERA_LOGIC_APP_URL || 'https://compliance-logic-',
      timeout: 30000, // 30 seconds
    });
  }

  async createTicket(
    payload: CreateAteraTicketDto,
    ctx: InvocationContext,
  ): Promise<CreateAteraTicketResult> {
    ctx.log('Creating Atera ticket via Logic App');
    ctx.log('Ticket payload:', JSON.stringify(payload, null, 2));

    try {
      // Call Logic App with retry logic (3 attempts)
      const response = await this.logicAppClient.invokeWithRetry<
        CreateAteraTicketDto,
        AteraTicketResponse
      >(payload, ctx, 3, 1000);

      if (!response.success) {
        ctx.error('Logic App call failed:', response.error);
        return {
          success: false,
          error: {
            code: response.error?.code || 'LOGIC_APP_ERROR',
            message: response.error?.message || 'Failed to create ticket in Atera',
            details: response.error?.details,
          },
        };
      }

      ctx.log('Logic App call succeeded');
      ctx.log('Response data:', JSON.stringify(response.data, null, 2));

      // Map Logic App response to our result format
      return {
        success: true,
        ticket: {
          ticketId: response.data?.ticketId,
          ticketNumber: response.data?.ticketNumber,
          title: payload.TicketTitle,
          status: 'created',
        },
      };
    } catch (error) {
      ctx.error('Unexpected error creating Atera ticket:', error);

      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
        },
      };
    }
  }

  async createTicketSimple(
    payload: CreateAteraTicketDto,
    ctx: InvocationContext,
  ): Promise<CreateAteraTicketResult> {
    ctx.log('Creating Atera ticket via Logic App (simple, no retry)');

    try {
      const response = await this.logicAppClient.invoke<
        CreateAteraTicketDto,
        AteraTicketResponse
      >(payload, ctx);

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.error?.code || 'LOGIC_APP_ERROR',
            message: response.error?.message || 'Failed to create ticket in Atera',
            details: response.error?.details,
          },
        };
      }

      return {
        success: true,
        ticket: {
          ticketId: response.data?.ticketId,
          ticketNumber: response.data?.ticketNumber,
          title: payload.TicketTitle,
          status: 'created',
        },
      };
    } catch (error) {
      ctx.error('Unexpected error creating Atera ticket:', error);

      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error,
        },
      };
    }
  }
}