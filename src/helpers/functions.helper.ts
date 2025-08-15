import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { env } from '../config/env';
import { LicenseTypeCode } from '../types/enum.type';

export const versionedRoute = (path: string, version: string = env.API_VERSION) => {
  if (!path) throw new Error('Path is required');
  return `${version}/${path}`;
};

export function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body };
}

export function isJson(req: HttpRequest) {
  return req.headers.get('content-type')?.includes('application/json');
}

// ---- utilities -------------------------------------------------------------

const DUPLICATE_MSSQL = new Set([2601, 2627]); // unique/PK dup
const FK_VIOLATION = 547; // foreign key (invalid locationTypeId, etc.)

export function isZodError(err: any): boolean {
  return !!err && Array.isArray(err.issues);
}

export function toHttpError(err: any): HttpResponseInit {
  if (isZodError(err)) {
    return json(400, { error: 'ValidationError', details: err.issues });
  }
  const code = Number(err?.driverError?.number ?? err?.code ?? err?.errno);
  if (DUPLICATE_MSSQL.has(code)) {
    return json(409, {
      error: 'Conflict',
      message: 'Duplicate key / unique constraint violation.',
    });
  }
  if (code === FK_VIOLATION) {
    return json(400, {
      error: 'BadRequest',
      message: 'Foreign key violation (check locationTypeId or related IDs).',
    });
  }
  return json(500, { error: 'InternalServerError' });
}

export function isGuid(id: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    id,
  );
}

// get by code could be added here as needed
export function isLicenseTypeCode(value: string): value is LicenseTypeCode {
  return (Object.values(LicenseTypeCode) as string[]).includes(value as LicenseTypeCode);
}
