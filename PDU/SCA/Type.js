'use strict';

var PDU     = require('../../pdu'),
    sprintf = require('sprintf');
    
function Type(value)
{
    value = value || 0x91;
    
    /**
     * Type of number
     * @var integer
     */
    this._type = 0x07 & (value>>4);
    
    /**
     * Numbering plan identification
     * @var integer
     */
    this._plan = 0x0F & value;
}

Type.TYPE_UNKNOWN           = 0x00;
Type.TYPE_INTERNATIONAL     = 0x01;
Type.TYPE_NATIONAL          = 0x02;
Type.TYPE_ACCEPTER_INTO_NET = 0x03;
Type.TYPE_SUBSCRIBER_NET    = 0x04;
Type.TYPE_ALPHANUMERICAL    = 0x05;
Type.TYPE_TRIMMED           = 0x06;
Type.TYPE_RESERVED          = 0x07;

Type.PLAN_UNKNOWN           = 0x00;
Type.PLAN_ISDN              = 0x01;
Type.PLAN_X_121             = 0x02;
Type.PLAN_TELEX             = 0x03;
Type.PLAN_NATIONAL          = 0x08;
Type.PLAN_INDIVIDUAL        = 0x09;
Type.PLAN_ERMES             = 0x0A;
Type.PLAN_RESERVED          = 0x0F;

/**
 * setter for type of number
 * @param type $type
 */
Type.prototype.setType = function(type)
{
    this._type = 0x07 & type;
};

/**
 * getter for type of number
 * @return integer
 */
Type.prototype.getType = function()
{
    return this._type;
};

/**
 * setter for numbering plan identification
 * @param type $plan
 */
Type.prototype.setPlan = function(plan)
{
    this._plan = 0x0F & plan;
};

/**
 * getter for numbering plan identification
 * @return integer
 */
Type.prototype.getPlan = function()
{
    return this._plan;
};

/**
 * get current value
 * @return integer
 */
Type.prototype.getValue = function()
{
    return (1 << 7) | (this.getType() << 4) | this.getPlan();
};

/**
 * magic method cast to string
 * @return string
 */
Type.prototype.toString = function()
{
    return sprintf("%02X", this.getValue());
};

module.exports = Type;