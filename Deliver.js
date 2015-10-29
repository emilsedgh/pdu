'use strict';

var PDU     = require('./pdu'),
    sprintf = require('sprintf'),
    util    = require('util');
    
function Deliver()
{
    
    Deliver.super_.apply(this, arguments);
    
    /**
     * 
     * @var SCTS
     */
    this._scts;
    
    this.setScts();
};

util.inherits(Deliver, PDU);

/**
 * set scts
 * @param string|null|PDU\SCTS time
 * @return Deliver
 */
Deliver.prototype.setScts = function(time)
{
    var SCTS = PDU.getModule('PDU/SCTS');
    
    if(time instanceof SCTS){
        this._scts = time;
    } else {
        this._scts = new SCTS(time || this._getDateTime());
    }
    
    return this;
};

/**
 * getter for scts
 * @return SCTS
 */
Deliver.prototype.getScts = function()
{
    return this._scts;
};

/**
 * get default datetime
 * @return string
 */
Deliver.prototype._getDateTime = function()
{
    // 10 days
    var time = (new Date()).getTime();
    return new Date(time + (3600*24*10*1000));
};

/**
 * set pdu type
 * @param array params
 * @return Deliver
 */
Deliver.prototype.initType = function(params)
{
    var DeliverType = require('./PDU/Type/Deliver');
    this._type = new DeliverType(params || []);
    return this;
};

/**
 * Magic method for cast to string
 * @return string
 */
Deliver.prototype.toString = function()
{
    var str = '';
    
    str += this.getSca().toString();
    str += this.getType().toString();
    str += this.getAddress().toString();
    str += sprintf("%02X", this.getPid().getValue());
    str += this.getDcs().toString();
    str += this.getScts().toString();
    
    return str;
};

Deliver.prototype.getStart = function()
{
    var str = '';
    
    str += this.getSca().toString();
    str += this.getType().toString();
    str += this.getAddress().toString();
    str += sprintf("%02X", this.getPid().getValue());
    str += this.getDcs().toString();
    str += this.getScts().toString();
    
    return str;
};

module.exports = Deliver;