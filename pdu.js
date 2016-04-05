var pduParser = {};

var sevenBitDefault = new Array('@', '£', '$', '¥', 'è', 'é', 'ù', 'ì', 'ò', 'Ç', '\n', 'Ø', 'ø', '\r','Å', 'å','\u0394', '_', '\u03a6', '\u0393', '\u039b', '\u03a9', '\u03a0','\u03a8', '\u03a3', '\u0398', '\u039e','\x1b', 'Æ', 'æ', 'ß', 'É', ' ', '!', '"', '#', '¤', '%', '&', '\'', '(', ')','*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7','8', '9', ':', ';', '<', '=', '>', '?', '¡', 'A', 'B', 'C', 'D', 'E','F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S','T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ñ', 'Ü', '§', '¿', 'a','b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o','p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ñ','ü', 'à');
var sevenBitEsc = new Array('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '^', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '{', '}', '', '', '', '', '', '\\', '', '', '', '', '', '', '', '', '', '', '', '', '[', '~', ']', 
    '', '|', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '€', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '');

pduParser.parse = function(pdu) {
    //Cursor points to the last octet we've read.
    var cursor = 0;

    var buffer = new Buffer(pdu.slice(0,4), 'hex');
    var smscSize = buffer[0];
    var smscType = buffer[1].toString(16);
    cursor = (smscSize*2+2);
    var smscNum  = pduParser.deSwapNibbles(pdu.slice(4, cursor));

    var buffer = new Buffer(pdu.slice(cursor,cursor+6), 'hex');
    cursor += 6;
    var smsDeliver = buffer[0];

    var smsDeliverBits = ("00000000"+parseInt(smsDeliver).toString(2)).slice(-8);
    var udhi = smsDeliverBits.slice(1,2) === "1";

    var senderSize = buffer[1];
    if(senderSize % 2 === 1)
        senderSize++;

    var senderType = parseInt(buffer[2]).toString(16)

    var encodedSender = pdu.slice(cursor, cursor + senderSize);
    var senderNum;
    if (senderType === '91') {
        senderNum = pduParser.deSwapNibbles(encodedSender);
    } else if (senderType === 'd0') {
        senderNum = this.decode7Bit(encodedSender).replace(/\0/g, '');
    } else {
        console.error('unsupported sender type.');
    }

    cursor += senderSize;

    var protocolIdentifier = pdu.slice(cursor, cursor+2);
    cursor += 2;

    var dataCodingScheme = pdu.slice(cursor, cursor+2);
    cursor = cursor+2;

    var encoding = pduParser.detectEncoding(dataCodingScheme);

    var timestamp = pduParser.deSwapNibbles(pdu.slice(cursor, cursor+14));


    var time = new Date;
    time.setUTCFullYear('20'+timestamp.slice(0,2));
    time.setUTCMonth(timestamp.slice(2,4)-1);
    time.setUTCDate(timestamp.slice(4,6));
    time.setUTCHours(timestamp.slice(6,8));
    time.setUTCMinutes(timestamp.slice(8,10));
    time.setUTCSeconds(timestamp.slice(10,12));

    var firstTimezoneOctet = parseInt(timestamp.slice(12,13));
    var binary = ("0000"+firstTimezoneOctet.toString(2)).slice(-4);
    var factor = binary.slice(0,1) === '1' ? 1 : -1;
    var binary = '0'+binary.slice(1, 4);
    var firstTimezoneOctet = parseInt(binary, 2).toString(10);
    var timezoneDiff = parseInt(firstTimezoneOctet + timestamp.slice(13, 14));
    var time = new Date(time.getTime() + (timezoneDiff * 15 * 1000 * 60 * factor));

    cursor += 14;

    var dataLength = parseInt(pdu.slice(cursor, cursor+2), 16).toString(10);
    cursor += 2;

    if(udhi) { //User-Data-Header-Indicator: means there's some User-Data-Header.
        var udhLength = pdu.slice(cursor, cursor+2);
        var iei = pdu.slice(cursor+2, cursor+4);
        if(iei == "00") { //Concatenated sms.
            var headerLength = pdu.slice(cursor+4, cursor+6);
            var referenceNumber = pdu.slice(cursor+6, cursor+8);
            var parts = pdu.slice(cursor+8, cursor+10);
            var currentPart = pdu.slice(cursor+10, cursor+12);
        }

        if(iei == "08") { //Concatenaded sms with a two-bytes reference number
            var headerLength = pdu.slice(cursor+4, cursor+6);
            var referenceNumber = pdu.slice(cursor+6, cursor+10);
            var parts = pdu.slice(cursor+10, cursor+12);
            var currentPart = pdu.slice(cursor+12, cursor+14);
        }

        if(iei == '00')
            cursor += (udhLength-2)*4;
        else if(iei == '08')
            cursor += ((udhLength-2)*4)+2;
        else
            cursor += (udhLength-2)*2;
    }

    if(encoding === '16bit')
        var text = pduParser.decode16Bit(pdu.slice(cursor), dataLength);
    else if(encoding === '7bit')
        if (udhi && iei=='00') var text = pduParser.decode7Bit(pdu.slice(cursor), dataLength-7, 1); //If iei ==0, then there is some unpadding to do
        else if (udhi && iei=='08') var text = pduParser.decode7Bit(pdu.slice(cursor), dataLength-8); //If no udhi or iei = 08 then no unpadding to do
        else var text = pduParser.decode7Bit(pdu.slice(cursor), dataLength);
    else if(encoding === '8bit')
        var text = ''; //TODO

    var data = {
        'smsc' : smscNum,
        'smsc_type' : smscType,
        'sender' : senderNum,
        'sender_type' : senderType,
        'encoding' : encoding,
        'time' : time,
        'text' : text
    };

    if(udhi) {
        data['udh'] = {
            'length' : udhLength,
            'iei' : iei,
        };

        if(iei == '00' || iei == '08') {
            data['udh']['reference_number'] = referenceNumber;
            data['udh']['parts'] = parseInt(parts);
            data['udh']['current_part'] = parseInt(currentPart);
        }
    }

    return data;
}

pduParser.detectEncoding = function(dataCodingScheme) {
    var binary = ('00000000'+(parseInt(dataCodingScheme, 16).toString(2))).slice(-8);

    if(binary == '00000000')
        return '7bit';

    if(binary.slice(0, 2) === '00') {
        var compressed = binary.slice(2, 1) === '1';
        var bitsHaveMeaning = binary.slice(3, 1) === '1';

        if(binary.slice(4,6) === '00')
            return '7bit';

        if(binary.slice(4,6) === '01')
            return '8bit';

        if(binary.slice(4,6) === '10')
            return '16bit';
    }
}

pduParser.decode16Bit = function(data, length) {
    //We are getting ucs2 characters.
    var ucs2 = '';
    for(var i = 0;i<=data.length-1;i=i+4) {
        ucs2 += String.fromCharCode("0x"+data[i]+data[i+1]+data[i+2]+data[i+3]);
    }

    return ucs2;
}

pduParser.deSwapNibbles = function(nibbles) {
    var out = '';
    for(var i = 0; i< nibbles.length; i=i+2) {
        if(nibbles[i] === 'F') //Dont consider trailing F.
            out += parseInt(nibbles[i+1], 16).toString(10);
        else
            out += parseInt(nibbles[i+1], 16).toString(10)+parseInt(nibbles[i], 16).toString(10);
    }
    return out;
}

pduParser.decode7Bit = function(code, length, unPadding) {
    //We are getting 'septeps'. We should decode them.
    var binary = '';
    for(var i = 0; i<code.length;i++)
        binary += ('0000'+parseInt(code.slice(i,i+1), 16).toString(2)).slice(-4);

    //This step is for 'unpadding' the padded data. If it has been encoded with 1 bit padding as it
    //happens when the sender used a 7-bit message concatenation (cf http://mobiletidings.com/2009/02/18/combining-sms-messages/)
    if (unPadding){
        var binary2 = '';
        binary = binary + '00000000';
        for (var i=0; i<binary.length/8 - 1 ; i++)
        {
            binary2 += (binary.slice((i+1)*8+(8-unPadding), (i+2)*8) + binary.slice(i*8,i*8+(8-unPadding)));
        }
        binary = binary2;
    }

    var bin = Array();
    var cursor = 0;
    var fromPrevious = '';
    var i = 0;
    while(binary[i]) {
        var remaining = 7 - fromPrevious.length;
        var toNext = 8 - remaining;
        bin[i] = binary.slice(cursor+toNext, cursor+toNext+remaining) + fromPrevious;
        var fromPrevious = binary.slice(cursor, cursor+toNext);
        if(toNext === 8)
            fromPrevious = '';
        else
            cursor += 8;
        i++;
    }

    var ascii = '';
    var esc = false; //last character was a ESC
    for(var i=0; i<length; i++){
        var codeNum = parseInt(bin[i], 2);
        if (codeNum == 0x1B){
            esc = true;
            continue;
        }
        if (esc)
            ascii += sevenBitEsc[codeNum];
        else
            ascii += sevenBitDefault[codeNum];
        esc = false;        
    }
    return ascii;
}

pduParser.encode7Bit = function(inTextNumberArray, paddingBits)
{
    //as explained here http://mobiletidings.com/2009/07/06/how-to-pack-gsm7-into-septets/
    var paddingBits = paddingBits || 0;
    var bits = 0;
    var out = "";

    if(paddingBits)
        {
            bits = 7 - paddingBits;
            var octet = (inTextNumberArray[0] << (7 - bits)) % 256
            out += ('00' + octet.toString(16)).slice(-2);
            bits++;
        }

    for(var i = 0; i < inTextNumberArray.length; i++ )
    {
        if( bits == 7 )
        {
            bits = 0;
            continue;
        }
        var octet = (inTextNumberArray[i] & 0x7f) >> bits;
        if( i < inTextNumberArray.length - 1 )
            {octet |= (inTextNumberArray[i + 1] << (7 - bits))%256;}
        out += ('00' + octet.toString(16)).slice(-2);
        bits++;
    }
    return out;
}

pduParser.encode16Bit = function(inTextNumberArray) {
    var out = '';
    for(var i = 0; i<inTextNumberArray.length;i++) {
        out += ('0000'+(inTextNumberArray[i].toString(16))).slice(-4);
    }
    return out;
}

pduParser.messageToNumberArray = function(message) //sp
{
    //7bit GSM encoding according to GSM_03.38 character set http://en.wikipedia.org/wiki/GSM_03.38
    res = [];
    for (var k=0; k<message.text.length; k++)
    {
        if (message.encoding == '7bit'){
            var character = message.text[k];
            for(var i=0;i<sevenBitDefault.length;i++)
            {
                if(sevenBitDefault[i] == character)
                    res.push(i);
                if (sevenBitEsc[i] == character){
                    res.push(0x1B); //escape character
                    res.push(i);
                }
            }
        }
        else if (message.encoding == '16bit')
            res.push(message.text.charCodeAt(k));
    }
    return res;
};

//TODO: TP-Validity-Period (Delivery)
pduParser.generate = function(message) {
    var pdu = '00';
    var parts = 1;
    var inTextNumberArray = this.messageToNumberArray(message);

    if(message.encoding === '16bit' && inTextNumberArray.length > 70)
        parts = inTextNumberArray.length / 66;

    else if(message.encoding === '7bit' && inTextNumberArray.length > 160)
        parts = inTextNumberArray.length / 153;

    parts = Math.ceil(parts);

    TPMTI  = 1;
    TPRD   = 4;
    TPVPF  = 8;
    TPSRR  = 32;
    TPUDHI = 64;
    TPRP   = 128;

    var submit = TPMTI;

    if(parts > 1) //UDHI
        submit = submit | TPUDHI;

    submit = submit | TPSRR;

    pdu += submit.toString(16);

    pdu += '00'; //TODO: Reference Number;

    var receiverSize = ('00'+(parseInt(message.receiver.length, 10).toString(16))).slice(-2);
    var receiver = pduParser.swapNibbles(message.receiver);
    var receiverType = 81; //TODO: NOT-Hardcoded PDU generation. Please note that Hamrah1 doesnt work if we set it to 91 (International).

    pdu += receiverSize.toString(16) + receiverType + receiver;

    pdu += '00'; //TODO TP-PID

    if(message.encoding === '16bit')
        pdu += '08';
    else if(message.encoding === '7bit')
        pdu += '00';

    var pdus = new Array();

    var csms = randomHexa(2); // CSMS allows to give a reference to a concatenated message

    for(var i=0; i< parts; i++) {
        pdus[i] = pdu;

        if(message.encoding === '16bit') {
            /* If there are more than one messages to be sent, we are going to have to put some UDH. Then, we would have space only
             * for 66 UCS2 characters instead of 70 */
            if(parts === 1)
                var length = 70;
            else
                var length = 66;

        } else if(message.encoding === '7bit') {
            /* If there are more than one messages to be sent, we are going to have to put some UDH. Then, we would have space only
             * for 153 ASCII characters instead of 160 */
            if(parts === 1)
                var length = 160;
            else
                var length = 153;
        }
        var text = inTextNumberArray.slice(i*length, (i*length)+length);

        if(message.encoding === '16bit') {
            user_data = pduParser.encode16Bit(text);
            var size = (user_data.length / 2);

            if(parts > 1)
                size += 6; //6 is the number of data headers we append.

        } else if(message.encoding === '7bit') {
            if(parts > 1){
                user_data = pduParser.encode7Bit(text,1);
                var size = 7 + text.length;
            }
            else {
                user_data = pduParser.encode7Bit(text);
                var size = text.length;
            }
        }

        pdus[i] += ('00'+parseInt(size).toString(16)).slice(-2);

        if(parts > 1) {
            pdus[i] += '05';
            pdus[i] += '00';
            pdus[i] += '03';
            pdus[i] +=  csms;
            pdus[i] += ('00'+parts.toString(16)).slice(-2);
            pdus[i] += ('00'+(i+1).toString(16)).slice(-2);
        }
        pdus[i] += user_data;
    }

    return pdus;
}


pduParser.swapNibbles = function(nibbles) {
    var out = '';
    for(var i = 0; i< nibbles.length; i=i+2) {
        if(typeof(nibbles[i+1]) === 'undefined') // Add a trailing F.
            out += 'F'+parseInt(nibbles[i], 16).toString(10);
        else
            out += parseInt(nibbles[i+1], 16).toString(10)+parseInt(nibbles[i], 16).toString(10);
    }
    return out;
}

pduParser.parseStatusReport = function(pdu) {
    //Cursor points to the last octet we've read.
    var cursor = 0;

    var smscSize = parseInt(pdu.slice(0, 2), 16);
    cursor += 2;

    var smscType = parseInt(pdu.slice(cursor, cursor+2), 16);
    cursor += 2;

    var smscNum  = pduParser.deSwapNibbles(pdu.slice(cursor, (smscSize*2)+2));
    cursor = (smscSize*2+2);

    var header = parseInt(pdu.slice(cursor,cursor+2));
    cursor += 2;

    var reference = parseInt(pdu.slice(cursor,cursor+2), 16);
    cursor += 2;

    var senderSize = parseInt(pdu.slice(cursor,cursor+2), 16);
    if(senderSize % 2 === 1)
        senderSize++;
    cursor += 2;

    var senderType = parseInt(pdu.slice(cursor,cursor+2));
    cursor += 2;

    var sender = pduParser.deSwapNibbles(pdu.slice(cursor, cursor+senderSize));

    var status = pdu.slice(-2);

    return {
        smsc:smscNum,
        reference:reference,
        sender:sender,
        status:status
    }
}

function randomHexa(size)
{
    var text = "";
    var possible = "0123456789ABCDEF";
    for( var i=0; i < size; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

module.exports = pduParser;

