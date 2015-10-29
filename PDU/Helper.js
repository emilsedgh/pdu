'use strict';

var PDU     = require('../pdu'),
    sprintf = require('sprintf');
    
function Helper()
{
    
}

Helper._limitNormal   = 140;
Helper._limitCompress = 160;
Helper._limitUnicode  = 70;

Helper.ucfirst = function(str)
{
    return str.substr(0, 1).toUpperCase() + str.substr(1);
};

/**
 * set limit
 * @param integer $limit
 * @param string $type
 */
Helper.setLimit = function(limit, type)
{
    Helper['_limit' + Helper.ucfirst(type)] = limit;
};

/**
 * getter for limit
 * @param string $type
 * @return integer
 */
Helper.getLimit = function(type)
{
    return Helper['_limit' + Helper.ucfirst(type)];
};

/**
 * ord() for unicode
 * @param string $char
 * @return integer
 */
Helper.order = function(char)
{
    return char.charCodeAt(0);
};

/**
 * chr() for unicode
 * @param integer $order
 * @return string
 */
Helper.char = function(order)
{
    return String.fromCharCode(order);
};
    
/**
 * decode message from unicode
 * @param string $text
 * @return srting
 */
Helper.decode16Bit = function(text)
{
    return text.match(/.{1,4}/g).map(function(hex){
        var buffer = new Buffer(hex, 'hex');
        return Helper.char((buffer[0]<<8) | buffer[1]);
    }).join("");
};
    
/**
 * decode message
 * @param string $text
 * @return string
 */
Helper.decode8Bit = function(text)
{
    return text.match(/.{1,2}/g).map(function(hex){
        var buffer = new Buffer(hex, 'hex');
        return Helper.char(buffer[1]);
    }).join("");
};

/**
 * decode message from 7bit
 * @param string $text
 * @return string
 */
Helper.decode7bit = function(text)
{
    var ret = [],
        data = new Buffer(text, "hex"),
        mask = 0xFF,
        shift = 0,
        carry = 0;
    
    for(var i = 0; i < data.length; i++){
        var char = data[i];
        if(shift === 7){
            ret.push(carry);
            carry = 0;
            shift = 0;
        }
        
        var a = (mask >> (shift+1)) & 0xFF,
            b = a ^ 0xFF;

        var digit = (carry) | ((char & a) << (shift)) & 0xFF;
        carry = (char & b) >> (7-shift);
        ret.push(digit);

        shift++;
    }
    
    if (carry){
        ret.push(carry);
    }
    
    return (new Buffer(ret, "binary")).toString();
};

/**
 * encode message
 * @param string $text
 * @return array
 */
Helper.encode8Bit = function(text)
{
    var length = 0,
        pdu    = '',
        buffer = new Buffer(text, "ascii");

    for(var i = 0; i < buffer.length; i++){
        pdu += sprintf("%02X", buffer[i]);
        length++;
    }
    
    return [length, pdu];
};

/**
 * encode message
 * @param string $text
 * @return array
 */
Helper.encode7bit = function(text)
{
    var ret   = [],
        data  = new Buffer(text),
        mask  = 0xFF,
        shift = 0,
        len   = data.length;
    
    for (var i = 0; i < len; i++) {
        
        var char     = data[i] & 0x7F,
            nextChar = (i+1 < len) ? (data[i+1] & 0x7F) : 0;
        
        if (shift === 7) { shift = 0; continue; }
        
        var carry  = (nextChar & (((mask << (shift+1)) ^ 0xFF) & 0xFF)),
            digit  = ((carry << (7-shift)) | (char >> shift) ) & 0xFF;
    
        ret.push(digit);
        
        shift++;
    }
    
    ret.unshift(
        ret.map(function(){
            return "%02X";
        }).join("")
    );
    
    return [len, sprintf.apply(sprintf, ret)];
};

/**
 * encode message
 * @param string $text
 * @return array
 */
Helper.encode16Bit = function(text)
{
    var length = 0,
        pdu    = '';
    
    for(var i = 0; i < text.length; i++){
        var byte    = Helper.order(text.substr(i, 1));
            pdu    += sprintf("%04X", byte);
            length += 2;
    }
    
    return [length, pdu];
};
    
/**
 * get pdu object by type
 * @return Deliver|Submit|Report
 * @throws Exception
 */
Helper.getPduByType = function()
{
    var Type = PDU.getModule('PDU/Type');
    
    // parse type of sms
    var type = Type.parse(),
        self = null;
    
    switch(type.getMti()){
        case Type.SMS_DELIVER:
            self = PDU.Deliver();
            break;
    
        case Type.SMS_SUBMIT:
            self = PDU.Submit();
            
            var buffer = new Buffer(PDU.getPduSubstr(2), 'hex');
            // get mr
            self.setMr(buffer[0]);
            break;
        
        case Type.SMS_REPORT:
            self = PDU.Report();
    
            var buffer = new Buffer(PDU.getPduSubstr(2), 'hex');
            // get reference
            self.setReference(buffer[0]);
            break;
        
        default:
            throw new Error("Unknown sms type");
            
    }
    
    // set type
    self.setType(type);
    
    return self;
};

Helper.initVars = function(pdu)
{
    
    var SCTS = PDU.getModule('PDU/SCTS'),
        PID  = PDU.getModule('PDU/PID'),
        DCS  = PDU.getModule('PDU/DCS'),
        VP   = PDU.getModule('PDU/VP'),
        Data = PDU.getModule('PDU/Data');
    
    // if is the report status
    if(pdu.getType() instanceof require('./Type/Report')){
        // parse timestamp
        pdu.setDateTime(SCTS.parse());
        
        // parse discharge
        pdu.setDischarge(SCTS.parse());
        
        var buffer = new Buffer(PDU.getPduSubstr(2), 'hex');
        // get status
        pdu.setStatus(buffer[0]);
    } else {
        // get pid
        pdu.setPid(PID.parse());

        // parse dcs
        pdu.setDcs(DCS.parse());

        // if this submit sms
        if(pdu.getType() instanceof require('./Type/Submit')){
            // parse vp
            pdu.setVp(VP.parse(pdu));
        } else {
            // parse scts
            pdu.setScts(SCTS.parse());
        }

        var buffer = new Buffer(PDU.getPduSubstr(2), 'hex');
        // get data length
        pdu.setUdl(buffer[0]);

        // parse data
        pdu.setData(Data.parse(pdu));
    }
        
    return pdu;
};

module.exports = Helper;