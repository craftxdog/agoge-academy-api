import { BadRequestException } from '@nestjs/common';
import { decodeCursor, encodeCursor } from './cursor.util';

describe('cursor utils', () => {
  it('encodes and decodes an opaque cursor', () => {
    const cursor = encodeCursor('record-123');

    expect(cursor).not.toBe('record-123');
    expect(decodeCursor(cursor)).toBe('record-123');
  });

  it('throws a bad request exception for invalid cursors', () => {
    expect(() => decodeCursor('not-valid')).toThrow(BadRequestException);
  });
});
