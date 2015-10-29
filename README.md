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
    var Submit = pdu.Submit(); // Submit, Deliver, Report

    // set number of sms center (optional)
    Submit.setSca('999999999999');

    // set number of recipent (required)
    Submit.setAddress('+999999999999');

    // set validity period 4 days (optional)
    Submit.setVp(3600 * 24 * 4);

    // set text of message (required)
    Submit.setData('Some text');

    // set status report request (optional, default is off)
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
Note: current version of module supported object format and will merged with object of the pdu type (Submit, Deliver, Report) 
```js
{ smsc: '9891100500',
smsc_type: '91',
sender: '989124834198',
sender_type: '91',
encoding: '7bit',
time: 1357953952000,
text: 'Javascript makes sense.' }
```

### pdu.parseStatusReport()
Will call method pdu.parse() and will create this format for legacy support 
```js
{ smsc:smscNum,
reference:reference,
sender:sender,
status:status }
```

### PDU
* statics 
 * [Submit] Submit() // create object of Submit
 * [Deliver] Deliver() // create object of Deliver
 * [Report] Report() // create object of Report
 * [void] debug(message) // if PDU.isDebug set true you will see debug information
 * [Submit] generate() // legacy support
 * [Submit|Deliver|Report] parse(str) // parse passwed string 
 * [Report] parseStatusReport() // legacy method, see parse() 

* object
 * [SCA] getAddress() // get Originator or Destination Address
 * [Data] getData() // get data 
 * [DCS] getDcs() // get Data Coding Scheme
 * [array] getPars() // get parts of message, see the Part class
 * [PID] getPid() // get Protoсol Identifier
 * [SCA] getSca() // get Service Centre Address
 * [Type] getType() // get Transport Protocol Data Unit
 * [integer] getUdl() // get User Data Length
 * [PDU] setAddress(SCA|String address) // set Originator or Destination Address
 * [PDU] setData(Data|String) // set data message
 * [PDU] setDcs(DCS|undefined dsc) // set Data Coding Scheme
 * [PDU] setPid(PDI|undefined pid) // set Protoсol Identifier
 * [PDU] setSca(SCA|String sca) // set Service Centre Address


### PDU/Submit - extended from PDU
* [integer] getMr() // get message reference
* [VP] getVp() // get validity period
* [void] setMr(integer mr) // set message reference
* [void] setVp(integer|string dtime) // set validity period

### PDU/Deliver - extended from PDU
* [SCTS] getScts() // get time
* [void] setScts(SCTS|Date) // set time

### PDU/Report - extended from PDU
* [SCTS] getDateTime() // get date time
* [SCTS] getDischarge() 
* [integer] getReference()
* [integer] getStatus()
* [void] setDateTime(datetime)
* [void] setDischarge(discharge)
* [void] setReference(reference)
* [void] setStatus(status)

### VP - Validity period
* [void] setDateTime(String datetime) // set date string fo Date.parse()
* [void] setInterval(Integer interval) // set interval in seconds

### Type - Transport Protocol Data Unit

* constants:
 * SMS_SUBMIT   = 0x01;
 * SMS_DELIVER  = 0x00;
 * SMS_REPORT   = 0x02;

 * VPF_NONE     = 0x00;
 * VPF_SIEMENS  = 0x01;
 * VPF_RELATIVE = 0x02;
 * VPF_ABSOLUTE = 0x03;

* methods:
 * [integer] getMti()
 * [integer] getSrr()
 * [integer] getUdhi()
 * [integer] getValue()
 * [integer] getVpf()

 * [integer] setSrr(Integer srr)
 * [integer] setUdhi(Integer udhi)
 * [integer] setVpf(Integer vpf) // one of constants VPF_{}

### Type/Deliver
### Type/Report
### Type/Submit

### SCTS - Time
* statics:
 * [SCTS] parse(hex) // parse hex string
 * [Integer] getTime()

* methods:
 * constructor(Date date) // 

### SCA 
### SCA/Type
### PID 
### DCS
### Data
### Data/Header
### Data/Part
### Helper