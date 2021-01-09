let fetch = require('node-fetch');

let options = {
    token: "",
    id: 0,
    api: '5.126'
};

let list = {
	"message_new": null,
	"message_edit": null,
	"message_action": null,
	"debug": async (a) => {console.log(a)}
};

let colors = { "red": "negative", "green": "positive", "blue": "primary", "while": "secondary" };

class VK {
    constructor (params = {}) {
        this.start = Date.now();
        this.params = params;
        this.params.options = {};
        options.token = this.params.token;
        options.id = this.params.GroupId;
        if(this.VersionApi) {
        options.api = this.params.VersionApi;
        }
        if(this.params.secretToken) {
            this.params.token = "secret";
            this.params.options.tokenPrivate = true;
        }
        if(this.params.autoUpdates == true) {
            this.params.options.startPolling = true;
            (async () => {
                let a = await api('groups.getLongPollServer');
                await startPolling(options.token, options.GroupId, a.response);
                return 'Done!';
            })();
        }
        if(this.params.secretToken) {
            delete this.params.secretToken;
        }
        if(this.params.autoUpdates) {
            delete this.params.autoUpdates;
        }
        this.on = (type, callback) => {
            list[type] = callback;
        };
        this.startPolling = async () => {
            let a = await api('groups.getLongPollServer');
            await startPolling(options.token, options.GroupId, a.response);
            return 'Done!';
        }
        this.api = async (method, p = {}) => {
            let res = await api(method, p);
            return res;
        }
        this.keyboard = (KeyboardButtons = [], paramsKeyboard = { oneTime: false, inlineKeyboard: false }) => {
            let KEY = [];
            let count = Number(0);
            if(KeyboardButtons.length < 1) return `Too few buttons are specified.`;
            if(KeyboardButtons.length >= 11) return `Too many buttons specified.`;
            KeyboardButtons.map(x => {
                KEY = new Array(...KEY, []), count += 1;
                x.map(z => {
                    let obj = { type: 'text', payload: {}, label: 'Text Keyboard' };
                    if(z.type) obj.type = z.type;
                    if(z.label) obj.label = z.label;
                    if(z.payload) obj.payload = z.payload;
                    KEY[count - 1].push({ action: obj, color: colors[z.color] ? colors[z.color] : colors['blue'] });
                });
            });
            let KEYBOARD = {};
            if(paramsKeyboard.oneTime) KEYBOARD.one_time = true;
            if(paramsKeyboard.inlineKeyboard) KEYBOARD.inline = true;
            KEYBOARD.buttons = KEY;
            return JSON.stringify(KEYBOARD);
        }
    }
}

let api = async (method, p = {}) => {
    let url = `https://api.vk.com/method/${method}?`;
    p = { v: options.api, group_id: options.id, access_token: options.token, random_id: Math.random(),  ...p };
    let o = [];
    for (let key in p) {
        if (p.hasOwnProperty(key)) {
            o.push(key + '=' + encodeURIComponent(p[key]));
        }
    }
    
    o = o.join('&');
            let ans = await fetch(url+o, {
            method: 'get',
            headers: {},  
            body: null,         
            follow: 1 })
    return ans.json();
}

let startPolling = async (token, group_id, a) => {
    let updates = await getUpdates(`${a.server}?act=a_check&key=${a.key}&ts=${a.ts}&wait=25`);
    if(updates.failed) {
        if(updates.failed == 2 || updates.failed == 3) {
            return this.ao(token, group_id);
        } else if(updates.failed == 1) {
            a.ts = updates.ts;
            return startPolling(token, group_id, a);
        }
    }
    if(a.ts != updates.ts) {
        a.ts = updates.ts;
    }
    updates.updates.map(async upd => {
    if(!list[upd.type]) return;
    if(upd.type == 'message_new' || upd.type == 'message_edit' || upd.type == 'message_reply') {
        upd.object.send = async (text, params) => {
            if(typeof text == 'object' && !text.message && !text.attachment) text = JSON.stringify(text, null, '\t');
            return api("messages.send",{ peer_id: upd.object.message.peer_id, random_id: 0, ...(typeof text !== 'object' ? { message: text, ...params } : text) });
        };
        upd.object.message.is_chat = upd.object.message.from_id != upd.object.message.peer_id;
        upd.object.message.chat_id = upd.object.message.is_chat ? (upd.object.message.peer_id - 2000000000) : null;
        upd.object.message.sendPhotos = async (raw, params) => {
            raw = !Array.isArray(raw) ? [raw] : raw;
            const FormData = require('form-data');
            let a = await api("photos.getMessagesUploadServer",{ peer_id: upd.object.message.peer_id });
            const attachment = await Promise.all(raw.map(async x => {
                return new Promise(async (resolve) => {
                const form = new FormData();
                let read = await fs.createReadStream(x);
                form.append("photo", read);
                await fetch(a.upload_url, { method: 'POST', body: form }).then(res => res.json()).then(async ans => {
                    ans = (await api("photos.saveMessagesPhoto",ans))[0];
                    resolve("photo"+ans.owner_id+"_"+ans.id+",");
                })
                })
                
            }));
            return api("messages.send",{ peer_id: upd.object.message.peer_id, random_id: 0, ...params, attachment })
        };
        upd.object.sendDocuments = async (raw, params) => {
            raw = !Array.isArray(raw) ? [raw] : raw;
            const FormData = require('form-data');
            let a = await api("docs.getMessagesUploadServer",{ peer_id: upd.object.message.peer_id });
            const attachment = await Promise.all(raw.map(async x => {
                return new Promise(async (resolve) => {
                const form = new FormData();
                let read = await fs.createReadStream(x);
                form.append("file", read);
                await fetch(a.upload_url, { method: 'POST', timeout: 0, body: form }).then(res => res.json()).then(async ans => {
                    let name = x.split("/").length;
                    ans = (await api("docs.save",{ ...ans, title: x.split("/")[name]  }));
                    console.log(ans)
                    resolve(ans.type+ans[ans.type].owner_id+"_"+ans[ans.type].id+",");
                })
                })
                
            }));
            return api("messages.send",{ peer_id: upd.object.message.peer_id, random_id: 0, ...params, attachment })
        };
        upd.object.sendAudioMessage = async (raw, params) => {
            raw = !Array.isArray(raw) ? [raw] : raw;
            const FormData = require('form-data');
            let a = await api("docs.getMessagesUploadServer",{ peer_id: upd.object.message.peer_id, type: "audio_message" });
            const attachment = await Promise.all(raw.map(async x => {
                return new Promise(async (resolve) => {
                const form = new FormData();
                let read = await fs.createReadStream(x);
                form.append("file", read);
                await fetch(a.upload_url, { method: 'POST', timeout: 0, headers: {}, body: form }).then(res => res.json()).then(async ans => {
                    let name = x.split("/").length;
                    ans = (await api("docs.save",ans));
                    resolve(ans.type+ans[ans.type].owner_id+"_"+ans[ans.type].id+",");
                })
                })
                
            }));
            return api("messages.send",{ peer_id: upd.object.message.peer_id, random_id: 0, ...params, attachment })
        };
        upd.object.sendPhoto = async (raw, params = {}) => {
            return upd.object.message.sendPhotos(raw, params);
        };
        upd.object.sendSticker = async (id) => {
            return api("messages.send",{ peer_id: upd.object.message.peer_id, random_id: 0, sticker_id: id });
        };
        upd.object.replySticker = async (id) => {
            return api("messages.send",{ peer_id: upd.object.message.peer_id, random_id: 0, reply_to: upd.object.message.id, sticker_id: id });
        };
        upd.object.reply = async (text, params = {}) => {
            if(typeof text == 'object' && !text.message && !text.attachment) text = JSON.stringify(text, null, '\t');
            return api("messages.send",{ peer_id: upd.object.message.peer_id, random_id: 0, reply_to: upd.object.message.id, ...(typeof text !== 'object' ? { message: text, ...params } : text) });
        };
        upd.object.forward = async (peer_id, v) => {
            return api("messages.send",{ peer_id: peer_id, random_id: 0, forward_messages: upd.object.message.id, ...(typeof params == "object" ? params : { message: params })  });
        };
        upd.object.edit = async (id, params = {}) => {
            return api("messages.edit",{ peer_id: upd.object.message.peer_id, conversation_message_id: id, random_id: 0, ...(typeof params == "object" ? params : { message: params })  });
        };
        upd.object.delete = async (id, params = {}) => {
            return api("messages.delete",{ peer_id: upd.object.message.peer_id, conversation_message_id: id, delete_for_all: true, random_id: 0, ...params  });
        };
        upd.object.removeChatUser = async (id, params = {}) => {
            return api("messages.removeChatUser",{ chat_id: upd.object.message.chat_id, member_id: id, ...(typeof params == "object" ? params : { chat_id: params })  });
        };
        upd.object.getConversation = async (id = upd.object.message.peer_id, params = {}) => {
            return api("messages.getConversationsById",{ peer_ids: id, ...(typeof params == "object" ? params : { chat_id: params })  });
        };
    
    
    }else if(upd.type == "message_event") {
        upd.object.send = async (text, params = {}) => {
            if(typeof text == 'object' && !text.message && !text.attachment) text = JSON.stringify(text, null, '\t');
            return api("messages.send",{ peer_id: upd.object.peer_id, random_id: 0, ...(typeof text !== 'object' ? { message: text, ...params } : text) });
        };
        upd.object.sendMessageEventAnswer = async (text) => {
            if(typeof text == 'object') text = JSON.stringify(text, null, '\t');
            return api("messages.sendMessageEventAnswer",{ peer_id: upd.object.peer_id, user_id: upd.object.user_id, event_id: upd.object.event_id, event_data: text });
        };
        upd.object.edit = async (m,params = {}) => {
            return api("messages.edit",{ peer_id: upd.object.peer_id, conversation_message_id: upd.object.conversation_message_id, random_id: 0, ...(typeof m == "object" ? m : { message: m }), ...params  });
        };
    
    }
    await list[upd.type](upd.object);
    })
    setTimeout(() => { startPolling(token, group_id, a); }, 50);
};

async function getUpdates(url) {
    return (await fetch(url, {
        method: 'GET',
        headers: {},  
        body: null,         
        follow: 1 })).json();
};

module.exports = VK;
