#!/usr/bin/env python3
"""Readwise MCP client for remote agent use.

Calls Readwise's MCP endpoint (mcp2.readwise.io/mcp) via HTTP
to list and fetch Reader documents. Used by the scheduled curation agent.
"""

import argparse
import http.client
import json
import sys


MCP_HOST = "mcp2.readwise.io"
MCP_PATH = "/mcp"
HEADERS_BASE = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
}


def _call_mcp(token: str, tool_name: str, arguments: dict) -> dict:
    headers = {**HEADERS_BASE, "Authorization": f"Bearer {token}"}
    conn = http.client.HTTPSConnection(MCP_HOST)

    # Initialize session
    init_req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "x-feed-curado-agent", "version": "1.0"},
        },
    }
    conn.request("POST", MCP_PATH, json.dumps(init_req), headers)
    conn.getresponse().read()

    # Call tool
    call_req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }
    conn.request("POST", MCP_PATH, json.dumps(call_req), headers)
    resp = conn.getresponse()
    body = resp.read().decode()
    conn.close()

    # Parse SSE response
    for line in body.split("\n"):
        if line.startswith("data: "):
            result = json.loads(line[6:])
            content = result.get("result", {}).get("content", [])
            for item in content:
                if item.get("type") == "text":
                    return json.loads(item["text"])
    raise RuntimeError(f"No text content in MCP response: {body[:500]}")


def list_feed_documents(token: str) -> list[dict]:
    data = _call_mcp(token, "reader_list_documents", {
        "location": "feed",
        "category": "rss",
    })
    return data.get("results", [])


def get_document_details(token: str, document_id: str) -> dict:
    return _call_mcp(token, "reader_get_document_details", {
        "document_id": document_id,
    })


def main():
    parser = argparse.ArgumentParser(description="Readwise MCP client")
    parser.add_argument("--token", required=True, help="Readwise Bearer token")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list-feed", help="List feed documents")

    get_cmd = sub.add_parser("get-document", help="Get document details")
    get_cmd.add_argument("--id", required=True, help="Document ID")

    args = parser.parse_args()

    if args.command == "list-feed":
        docs = list_feed_documents(args.token)
        json.dump(docs, sys.stdout, indent=2)
    elif args.command == "get-document":
        doc = get_document_details(args.token, args.id)
        json.dump(doc, sys.stdout, indent=2)


if __name__ == "__main__":
    main()
