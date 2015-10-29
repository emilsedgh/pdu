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
Depricated, but works
```js
    pdu.generate({
      text:'Some text',
      receiver:999999999999, //MSISDN
      encoding:'16bit' //Or 7bit if you're sending an ascii message.
    });
```

returns an array of generated pdu's.

### pdu.Submit() 
```js
    var Submit = pdu.Submit();

    // set number of sms center
    Submit.setSca('999999999999');

    // set number of recipent
    Submit.setAddress('+999999999999');

    // set validity period 4 days
    Submit.setVp(3600 * 24 * 4);

    // set text of message
    Submit.setData('Some text');

    // set status report request
    Submit.getType().setSrr(1);

    // get all parts of message
    var parts = Submit.getParts();

    parts.forEach(function(part){
      // part is object, instance of ./PDU/Data/Part, could be casted to string like ('' + part) or part.toString()
    });
```

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
