'use strict';

var PDU     = require('./pdu'),
    sprintf = require('sprintf'),
    util    = require('util');
    
function Submit()
{
    
    Submit.super_.apply(this, arguments);
    
    /**
     * Message Reference
     * not changed for submit message
     * @var integer
     */
    this._mr = 0x00;
    
    /**
     * Validity Period
     * @var VP
     */
    this._vp;
    
    this.setVp();
};

util.inherits(Submit, PDU);

/**
 * set validity period
 * @param string|int value
 * @return Submit
 */
Submit.prototype.setVp = function(value)
{
    var VP = PDU.getModule('PDU/VP');
    
    if(value instanceof VP){
        this._vp = value;
        return this;
    }
    
    this._vp = new VP(this);
    
    if(typeof(value) === 'string'){
        this._vp.setDateTime(value);
    } else {
        this._vp.setInterval(value);
    }
    
    return this;
};

/**
 * getter validity period
 * @return VP
 */
Submit.prototype.getVp = function()
{
    return this._vp;
};

/**
 * getter message reference
 * @return integer
 */
Submit.prototype.getMr = function()
{
    return this._mr;
};

/**
 * setter message reference
 * @param integer mr
 */
Submit.prototype.setMr = function(mr)
{
    this._mr = mr;
};

/**
 * set pdu type
 * @param array params
 * @return Submit
 */
Submit.prototype.initType = function(params)
{
    var SubmitType = require('./PDU/Type/Submit');
    this._type = new SubmitType(params || []);
    return this;
};

/**
 * Magic method for cast to string
 * @return string
 */
Submit.prototype.toString = function()
{
    return this.getParts().map(function(part){
        return part.toString();
    }).join("\n");
};

Submit.prototype.getStart = function()
{
    var str = '';
    str += this.getSca().toString();
    str += this.getType().toString();
    str += sprintf("%02X", this.getMr());
    str += this.getAddress().toString();
    str += sprintf("%02X", this.getPid().getValue());
    str += this.getDcs().toString();
    str += this.getVp().toString();

    return str;
};

module.exports = Submit;