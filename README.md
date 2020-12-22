# js-vk
js-vk - a convenient module for working with VK API
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
autoUpdates: true });

(async () => {
const result = await vk.api('users.get', { user_id: 1 });
console.log(result);
})();

vk.on('message_new', async (message) => {
console.log(message);
});
```
