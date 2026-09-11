import { BadRequestException } from '@nestjs/common';
import { resolveMcpToolArguments } from '@server/root/modules/mcp-gateway/mcp-tool-arguments';

describe('resolveMcpToolArguments', () => {
  it('defaults missing arguments to an empty object', () => {
    expect(resolveMcpToolArguments({})).toEqual({});
  });

  it('accepts a nested JSON object from the direct object transport', () => {
    const argumentsValue = {
      query: 'hello',
      count: 2,
      enabled: true,
      optional: null,
      tags: ['one', 'two'],
      options: {
        depth: 3,
        filters: [{ name: 'type', values: ['screen', 'component'] }],
      },
    };

    expect(resolveMcpToolArguments({ arguments: argumentsValue })).toEqual(
      argumentsValue,
    );
  });

  it('parses nested JSON from the GPT-safe string transport', () => {
    expect(
      resolveMcpToolArguments({
        argumentsJson:
          '{"projectId":"p1","options":{"depth":2,"ids":["a","b"]}}',
      }),
    ).toEqual({
      projectId: 'p1',
      options: {
        depth: 2,
        ids: ['a', 'b'],
      },
    });
  });

  it('rejects a non-object JSON root', () => {
    expect(() =>
      resolveMcpToolArguments({ argumentsJson: '["not","an","object"]' }),
    ).toThrow(BadRequestException);
  });

  it('rejects malformed JSON', () => {
    expect(() =>
      resolveMcpToolArguments({ argumentsJson: '{"broken":' }),
    ).toThrow(BadRequestException);
  });

  it('rejects ambiguous dual representations', () => {
    expect(() =>
      resolveMcpToolArguments({
        arguments: { value: 1 },
        argumentsJson: '{"value":1}',
      }),
    ).toThrow(BadRequestException);
  });
});
