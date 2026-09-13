import { parseRemoteMcpResponse } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-response';

describe('parseRemoteMcpResponse', () => {
  it('stops reading a JSON response after the byte limit', async () => {
    const cancel = jest.fn();
    const response = new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"result":"'));
        controller.enqueue(new TextEncoder().encode('x'.repeat(40)));
      },
      cancel,
    }), { headers: { 'Content-Type': 'application/json' } });

    await expect(parseRemoteMcpResponse(response, 32)).rejects.toMatchObject({
      status: 502,
      response: expect.objectContaining({ code: 'MCP_RESPONSE_TOO_LARGE' }),
    });
    expect(cancel).toHaveBeenCalled();
  });

  it('applies the same byte limit to event-stream responses', async () => {
    const response = new Response(`data: ${'x'.repeat(40)}\n\n`, {
      headers: { 'Content-Type': 'text/event-stream' },
    });

    await expect(parseRemoteMcpResponse(response, 32)).rejects.toMatchObject({
      status: 502,
      response: expect.objectContaining({ code: 'MCP_RESPONSE_TOO_LARGE' }),
    });
  });
});
