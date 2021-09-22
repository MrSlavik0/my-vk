js-vk
=====================
JS-VK - a convenient module for working with VK API
=====================
**`Installation`**
```node
npm install js-vk
```

`Usage example`
```node
const VK = require("js-vk");
const vk = new VK({ 
token: process.env.TOKEN, 
GroupId: process.env.GROUP, 
autoUpdates: true,
secretToken: true,
logs: true // false if you do not want the to be written to a file
});

(async () => {
const result = await vk.api('users.get', { user_id: 1 });
console.log(result);
})();

vk.on('message_new', async (message) => {
console.log(message);
await message.send('Hello World!');
await message.edit(message.message.conversation_message_id + 1, 'Hello World 2!');
return;
});
```
### `Keyboard`
> The keyboard parameter is assigned to the messages.send method
```node
const params = { user_id: process.env.OWNER,
message: "Test message",
vk.keyboard([[{ 
  label: 'Keyboard #1',
  color: 'blue',
  type: 'text',
  payload: {} },
{ 
  label: 'Keyboard #2',
  color: 'blue',
  type: 'text',
  payload: {} 
  }
  ],
    [
      { 
        label: 'Keyboard #3',
        color: 'blue',
        type: 'text',
        payload: {} },
      { 
        label: 'Keyboard #4',
        color: 'blue',
        type: 'text',
        payload: {} 
       }
     ]
    ], 
  { inlineKeyboard: true 
  })
};
// The color parameter can take 4 values: blue (primary), white (secondary), red (negative), green (positive)
// This keyboard has additional parameters inlineKeyboard and oneTime
(async () => {
const params = {
  message: "JS-VK!",
  peer_id: vk.defaultPeerId + 1 || 2000000001
}
const result = await vk.api('messages.send', params);
console.log(result);
})();

(async () => {
const params = {
  message: "JS-VK!",
  peer_id: vk.defaultPeerId + 1 || 2000000001
}
const result = await vk.api.messages.send(params);
console.log(result);
})();
```
