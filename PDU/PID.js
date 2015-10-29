'use strict';

var PDU     = require('../pdu'),
    sprintf = require('sprintf');
    
function PID()
{
    /**
     * pid value
     * @var integer
     */
    this._pid = PID.PID_ASSIGNED;
    
    /**
     * value = 0 : no interworking, but SME-to-SME protocol
     * value = 1 : telematic interworking
     * @var integer
     */
    this._indicates = 0x00;
    
    /**
     * type value
     * @var integer
     */
    this._type = PID.TYPE_IMPLICIT;
    
    
}

PID.PID_ASSIGNED   = 0x00; // Assigns bits 0..5 as defined below
PID.PID_GSM_03_40  = 0x01; // See GSM 03.40 TP-PID complete definition
PID.PID_RESERVED   = 0x02; // Reserved
PID.PID_SPECIFIC   = 0x03; // Assigns bits 0-5 for SC specific use

PID.TYPE_IMPLICIT  = 0x00; // Implicit
PID.TYPE_TELEX     = 0x01; // telex (or teletex reduced to telex format)
PID.TYPE_TELEFAX   = 0x02; // group 3 telefax
PID.TYPE_VOICE     = 0x04; // voice telephone (i.e. conversion to speech)
PID.TYPE_ERMES     = 0x05; // ERMES (European Radio Messaging System)
PID.TYPE_NPS       = 0x06; // National Paging system (known to the SC
PID.TYPE_X_400     = 0x11; // any public X.400-based message handling system
PID.TYPE_IEM       = 0x12; // Internet Electronic Mail

PID.parse = function()
{
    var buffer = Buffer(PDU.getPduSubstr(2), 'hex'),
        byte   = buffer[0],
        self   = new PID();
    
    self.setPid(byte >> 6);
    self.setIndicates(byte >> 5);
    self.setType(byte);
    
    return self;
};

/**
 * getter for the pid
 * @return integer
 */
PID.prototype.getPid = function()
{
    return this._pid;
};

/**
 * setter for the pid
 * @param integer $pid
 */
PID.prototype.setPid = function(pid)
{
    this._pid = 0x03 & pid;
};

/**
 * getter for the indicates
 * @return integer
 */
PID.prototype.getIndicates = function()
{
    return this._indicates;
};

/**
 * setter for the indicates
 * @param integer $indicates
 */
PID.prototype.setIndicates = function(indicates)
{
    this._indicates = 0x01 & indicates;
};

/**
 * getter for the type
 * @return integer
 */
PID.prototype.getType = function()
{
    return this._type;
};

/**
 * setter for the type
 * @param integer $type
 */
PID.prototype.setType = function(type)
{
    this._type = 0x1F & type;
};

/**
 * getter for ready value
 * @return integer
 */
PID.prototype.getValue = function()
{
    return (this._pid << 6) | (this._indicates << 5) | this._type;
};

/**
 * cast to string
 * @return string
 */
PID.prototype.toString = function()
{
    return '' + this.getValue();
};

module.exports = PID;