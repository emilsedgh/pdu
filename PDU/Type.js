'use strict';

var PDU     = require('../pdu'),
    sprintf = require('sprintf');
    
function Type()
{
    
    
    /**
     * Reply Path
     * @var integer
     */
    this._rp;
    
    
    /**
     * User Data Header
     * @var integer
     */
    this._udhi;
    
    /**
     * Status Report Request
     * @var integer
     */
    this._srr;
    
    /**
     * Validity Period Format
     * @var integer
     */
    this._vpf;
    
    /**
     * Reject Duplicates
     * @var integer
     */
    this._rd;
    
    /**
     * Message Type Indicator
     * @var integer
     */
    this._mti;
};

Type.SMS_SUBMIT   = 0x01;
Type.SMS_DELIVER  = 0x00;
Type.SMS_REPORT   = 0x02;

Type.VPF_NONE     = 0x00;
Type.VPF_SIEMENS  = 0x01;
Type.VPF_RELATIVE = 0x02;
Type.VPF_ABSOLUTE = 0x03;


/**
 * parse sms type
 * @return Type
 * @throws Error
 */
Type.parse = function()
{
    var buffer = new Buffer(PDU.getPduSubstr(2), 'hex'),
        byte   = buffer[0],
        type   = null;
    
    switch((3&byte)){
        case Type.SMS_DELIVER:
            type = new (require('./Type/Deliver'))();
            break;
        case Type.SMS_SUBMIT:
            type = new (require('./Type/Submit'))();
            break;
        case Type.SMS_REPORT:
            type = new (require('./Type/Report'))();
            break;
        default:
            throw new Error("Unknown type sms");
    }
    
    type._rp   = (1&byte>>7);
    type._udhi = (1&byte>>6);
    type._srr  = (1&byte>>5);
    type._vpf  = (3&byte>>3);
    type._rd   = (1&byte>>2);
    type._mti  = (3&byte);
    
    return type;
        
};

/**
 * Calculate byte value
 * @return integer
 */
Type.prototype.getValue = function()
{
    return ((1 & this._rp)   << 7) | 
           ((1 & this._udhi) << 6) | 
           ((1 & this._srr)  << 5) | 
           ((3 & this._vpf)  << 3) | 
           ((1 & this._rd)   << 2) | 
           ((3 & this._mti));
};

/**
 * set validity period format
 * @param integer vpf
 * @throws Error
 */
Type.prototype.setVpf = function(vpf)
{
    this._vpf = (0x03&vpf);
    
    switch(this._vpf){
        case Type.VPF_NONE: break;
        case Type.VPF_SIEMENS: break;
        case Type.VPF_RELATIVE: break;
        case Type.VPF_ABSOLUTE: break;
        default: 
            throw new Error("Wrong validity period format");
    }
};

/**
 * getter for vpf
 * @return integer
 */
Type.prototype.getVpf = function()
{
    return this._vpf;
};

/**
 * set user data header
 * @param type udhi
 */
Type.prototype.setUdhi = function(udhi)
{
    this._udhi = (0x01&udhi);
};

/**
 * getter for udhi
 * @return integer
 */
Type.prototype.getUdhi = function()
{
    return this._udhi;
};

/**
 * set status report request
 * @param integer srr
 */
Type.prototype.setSrr = function(srr)
{
    this._srr = (0x01&srr);
};

/**
 * getter for status report request
 * @return integer
 */
Type.prototype.getSrr = function()
{
    return this._srr;
};

/**
 * getter for mti
 * @return integer
 */
Type.prototype.getMti = function()
{
    return this._mti;
};

/**
 * Magic method for cast to string
 * @return string
 */
Type.prototype.toString = function()
{
    return sprintf("%02X", this.getValue());
};


module.exports = Type;