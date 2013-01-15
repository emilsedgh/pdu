var pdu = require('./index');

console.log(pdu.generate({
    text:'Some text',
    receiver:999999999999, //MSISDN
    encoding:'16bit' //Or 7bit if you're sending an ascii message.
}));

console.log(pdu.parse('06918919015000240C9189194238148900003110211052254117CAB03D3C1FCBD3703AA81D5E97E7A079D93D2FBB00'));