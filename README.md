# pdu.js

PDU parser and generator for node or your browser.

## How to install

```bash
npm install pdu.js
```

## How to use

First require it:
```js
var pdu = require('pdu');
```


### pdu.generate()
```js
    pdu.generate({
      text:'Some text',
      receiver:999999999999, //MSISDN
      encoding:'16bit' //Or 7bit if you're sending an ascii message.
    });
```

returns an array of generated pdu's.

### pdu.parse()
```js
pdu.parse('06918919015000240C9189194238148900003110211052254117CAB03D3C1FCBD3703AA81D5E97E7A079D93D2FBB00');
```

Returns an object, containing parsed information:
```js
{ smsc: '9891100500',
smsc_type: '91',
sender: '989124834198',
sender_type: '91',
encoding: '7bit',
time: 1357953952000,
text: 'Javascript makes sense.' }
```
