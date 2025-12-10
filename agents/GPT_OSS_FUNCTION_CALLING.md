# GPT-OSS Function Calling Prompt Building Guide

This document explains how to build prompts supporting Function Calling for gpt-oss models (Harmony format).

## Overview

gpt-oss uses **Harmony format**, which differs from the standard OpenAI API's `tools` parameter. You need to manually define tools in the prompt and parse model output.

## Complete System Prompt Template

Put everything in a single system prompt:

```
You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: {CURRENT_DATE}

Reasoning: {REASONING_LEVEL}

# Valid channels: analysis, commentary, final. Channel must be included for every message.
Calls to these tools must go to the commentary channel: 'functions'.

# Instructions

{YOUR_INSTRUCTIONS}

# Tools

## functions

namespace functions {

{FUNCTION_DEFINITIONS}

} // namespace functions
```

**Parameter Description:**

| Parameter                | Description                                | Example                       |
| ------------------------ | ------------------------------------------ | ----------------------------- |
| `{CURRENT_DATE}`         | Current date                               | `2025-06-28`                  |
| `{REASONING_LEVEL}`      | Reasoning depth: `low` / `medium` / `high` | `low`                         |
| `{YOUR_INSTRUCTIONS}`    | Your system instructions                   | `You are a helpful assistant` |
| `{FUNCTION_DEFINITIONS}` | Tool definitions                           | See below                     |

## Tool Definition Syntax

Use TypeScript-style definitions:

```typescript
// Function description (required)
type function_name = (_: {
  // Parameter description
  param_name: param_type;
  // Optional parameter description
  optional_param?: param_type; // default: default_value
}) => any;

// Function without parameters
type no_args_function = () => any;
```

**Supported Types:**

| Type     | Syntax       | Example                           |
| -------- | ------------ | --------------------------------- |
| String   | `string`     | `city: string`                    |
| Number   | `number`     | `limit: number`                   |
| Boolean  | `boolean`    | `verbose: boolean`                |
| Enum     | `"a" \| "b"` | `unit: "celsius" \| "fahrenheit"` |
| Array    | `type[]`     | `cities: string[]`                |
| Optional | `name?`      | `limit?: number`                  |

## Complete Example

### System Prompt

```
You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: 2025-06-28

Reasoning: low

# Valid channels: analysis, commentary, final. Channel must be included for every message.
Calls to these tools must go to the commentary channel: 'functions'.

# Instructions

You are a helpful AI assistant. Please respond to users.
When real-time information is needed, use the provided tools.

# Tools

## functions

namespace functions {

// Get weather information for a specified city
type get_weather = (_: {
// City name, e.g.: Beijing, Shanghai
city: string,
// Temperature unit
unit?: "celsius" | "fahrenheit", // default: celsius
}) => any;

// Search the web for information
type web_search = (_: {
// Search keywords
query: string,
// Number of results to return
limit?: number, // default: 5
}) => any;

// Query local knowledge base
type local_rag = (_: {
// Query content
query: string,
// Number of documents to return
top_k?: number, // default: 3
}) => any;

// Get current time
type get_current_time = () => any;

} // namespace functions
```

### Python Code Example

```python
from openai import OpenAI
from datetime import date

client = OpenAI(base_url="YOUR_ENDPOINT/v1", api_key="not-needed")

SYSTEM_PROMPT = f"""You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: {date.today().isoformat()}

Reasoning: low

# Valid channels: analysis, commentary, final. Channel must be included for every message.
Calls to these tools must go to the commentary channel: 'functions'.

# Instructions

You are a helpful AI assistant.

# Tools

## functions

namespace functions {{

// Get weather information for a specified city
type get_weather = (_: {{
// City name
city: string,
}}) => any;

}} // namespace functions"""

messages = [
    {"role": "system", "content": SYSTEM_PROMPT},
    {"role": "user", "content": "What's the weather like in Beijing?"}
]

response = client.chat.completions.create(
    model="default",
    messages=messages,
    max_tokens=1000
)

print(response.choices[0].message.content)
```

## Model Output Format

### Function Call

```
<|channel|>analysis<|message|>User is asking about Beijing weather, need to call get_weather.<|end|>
<|start|>assistant<|channel|>commentary to=functions.get_weather <|constrain|>json<|message|>{"city":"Beijing"}<|call|>
```

### Direct Response

```
<|channel|>analysis<|message|>Simple question, answer directly.<|end|>
<|start|>assistant<|channel|>final<|message|>Hello! How can I help you?<|return|>
```

## Parsing Model Output

```python
import re
import json
from typing import Optional

def _extract_json_from_position(content: str, start: int) -> Optional[str]:
    """
    Extract complete JSON object from specified position.
    Correctly handles nested braces and special characters inside strings.
    """
    if start >= len(content) or content[start] != '{':
        return None

    depth = 0
    in_string = False
    escape_next = False

    for i in range(start, len(content)):
        char = content[i]

        if escape_next:
            escape_next = False
            continue

        if char == '\\' and in_string:
            escape_next = True
            continue

        if char == '"' and not escape_next:
            in_string = not in_string
            continue

        if in_string:
            continue

        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                return content[start:i + 1]

    return None


def parse_harmony_response(content: str) -> dict:
    """Parse harmony format model output"""
    result = {
        "thinking": None,       # Thinking process (not shown to user)
        "function_calls": [],   # Function call list (supports multiple)
        "final_answer": None,   # Final response
    }

    # Extract thinking process
    analysis = re.search(
        r'<\|channel\|>analysis<\|message\|>(.*?)(?:<\|end\|>|<\|call\|>|$)',
        content, re.DOTALL
    )
    if analysis:
        result["thinking"] = analysis.group(1).strip()

    # Extract function calls (using bracket counting for nested JSON)
    func_pattern = re.compile(
        r'to=functions\.(\w+)\s*(?:<\|constrain\|>[^<]*)?<\|message\|>',
        re.DOTALL
    )
    for match in func_pattern.finditer(content):
        func_name = match.group(1)
        json_start = match.end()
        args_json = _extract_json_from_position(content, json_start)

        if args_json:
            try:
                result["function_calls"].append({
                    "name": func_name,
                    "arguments": json.loads(args_json)
                })
            except json.JSONDecodeError:
                result["function_calls"].append({
                    "name": func_name,
                    "arguments": {"raw": args_json}
                })

    # Extract final response
    final = re.search(
        r'<\|channel\|>final<\|message\|>(.*?)(?:<\|return\|>|<\|end\|>|$)',
        content, re.DOTALL
    )
    if final:
        result["final_answer"] = final.group(1).strip()

    return result
```

**Note:** Using `_extract_json_from_position` correctly handles nested JSON like `{"a": {"b": 1}}`. Simple regex `\{[^}]*\}` would truncate at the first `}`.

## Handling Function Call Results

After executing a function, there are two ways to pass results back to the model:

### Method 1: OpenAI Style (Recommended)

Pass tool results as a separate `[Tool Results]` block, keeping original chat history clean:

```python
# Execute tool
weather_result = get_weather("Beijing")

# Build tool results message (separate from chat history)
tool_results_message = f"""[Tool Results]
**get_weather**:
{json.dumps(weather_result, ensure_ascii=False, indent=2)}

Now provide your response based on the tool results above."""

# Only append tool results (don't append assistant's function call)
messages.append({"role": "user", "content": tool_results_message})

# Continue request
response = client.chat.completions.create(model="default", messages=messages)
```

**Advantages:**

- Chat history stays clean
- Tool results clearly separated from conversation
- Follows OpenAI's `role: "tool"` design philosophy

### Method 2: Harmony Format

Append tool results in Harmony format:

```python
def build_tool_result(func_name: str, result: dict) -> str:
    """Build tool result message (Harmony format)"""
    result_json = json.dumps(result, ensure_ascii=False)
    return f"<|start|>functions.{func_name} to=assistant<|channel|>commentary<|message|>{result_json}<|end|>"

# Usage example
tool_result = build_tool_result("get_weather", {"temperature": 25, "condition": "Sunny"})

# Append to conversation (must also append assistant message)
messages.append({"role": "assistant", "content": "<|channel|>commentary to=functions.get_weather<|message|>{\"city\":\"Beijing\"}<|call|>"})
messages.append({"role": "user", "content": tool_result})

# Continue request
response = client.chat.completions.create(model="default", messages=messages)
```

**Note:** When using Method 2, assistant message should not contain `analysis` block, only the function call part.

## Channel Description

| Channel      | Purpose                | Show to User |
| ------------ | ---------------------- | ------------ |
| `analysis`   | Model thinking process | ❌ No        |
| `commentary` | Function calls         | ❌ No        |
| `final`      | Final response         | ✅ Yes       |

## Multi-Tool Definition Example

```
# Tools

## functions

namespace functions {

// Get weather information
type get_weather = (_: {
// City name
city: string,
}) => any;

// Web search
type web_search = (_: {
// Search query
query: string,
}) => any;

// Knowledge base retrieval
type local_rag = (_: {
// Retrieval question
query: string,
// Number of results
top_k?: number, // default: 3
}) => any;

// Execute code
type run_code = (_: {
// Code language
language: "python" | "javascript",
// Code content
code: string,
}) => any;

// Send message (no parameters example)
type send_notification = () => any;

} // namespace functions
```

## Important Notes

1. **Reasoning Level Selection**

   - `low`: Simple tasks, saves tokens
   - `medium`: General tasks
   - `high`: Complex reasoning tasks

2. **Security**

   - `analysis` channel content is not safety filtered, do not show to users

3. **Multi-turn Conversations**

   - Remove previous `analysis` content in subsequent turns
   - Only keep `final` responses as history

4. **Date Updates**
   - `Current date` should use actual current date
