# chatkit-vue

Vue 3 bindings for the [ChatKit Web Component](https://www.npmjs.com/package/@openai/chatkit-js).

## Installation

```bash
pnpm add @openai/chatkit-js chatkit-vue
```

## Usage

```vue
<script setup>
import { ChatKit, useChatKit } from 'chatkit-vue';

const chat = useChatKit({
  apiKey: 'YOUR_API_KEY',
  threadId: 'thread_123',
});
</script>

<template>
  <ChatKit :control="chat.control" class="chatkit" />
</template>
```

Refer to the [ChatKit documentation](https://github.com/openai/chatkit-js) for detailed API usage.
