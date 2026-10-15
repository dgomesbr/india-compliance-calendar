# MCP server

Lets AI agents query the India Compliance Calendar over the
[Model Context Protocol](https://modelcontextprotocol.io). The agent is the MCP
client; this is the server it talks to.

- No dependencies. Node 22.18 or later runs `server.ts` directly.
- Speaks newline-delimited JSON-RPC 2.0 over stdio (protocol versions
  2024-11-05 to 2025-11-25).
- Reads the published bundle at
  `https://dgomesbr.github.io/india-compliance-calendar/api/v1/bundle.json`,
  cached for six hours, so answers match the website. Set `ICC_DATA_URL` to
  another URL or a local file (for example `dist/api/v1/bundle.json` after
  `npm run build`).

## Install

Claude Code:

```sh
claude mcp add india-compliance-calendar -- node /path/to/india-compliance-calendar/mcp/server.ts
```

Claude Desktop, Cursor and other clients with an `mcpServers` file:

```json
{
  "mcpServers": {
    "india-compliance-calendar": {
      "command": "node",
      "args": ["/path/to/india-compliance-calendar/mcp/server.ts"]
    }
  }
}
```

## Tools

| Tool | Use it for |
|---|---|
| `upcoming_obligations` | Due items for a horizon (`1w`, `2w`, `1m`, `1q`, `ye`, `fy`, or `custom` with `months` up to 24), filtered by `categories`, `audience`, `states`, `entity`, `gst`, ordered by `due`, `exposure` or `law` |
| `get_obligation` | One rule by `id` or form `code`: schedule, applicability, law, penalty exposure, sources, next due dates |
| `search_obligations` | Find rules by form, section, authority or keyword |
| `event_deadlines` | Every deadline after an event (`agm-held`, allotment, director change, ...) on a date; call without arguments to list events |
| `check_date` | Holidays and obligations on a date |
| `list_holidays` | Holidays between two dates, by kind and scope |
| `regulatory_updates` | Latest items from the regulators' feeds |

All tools are read-only. Answers are information, not legal advice.

## Test

```sh
npm test -- tests/mcp.test.ts
```
