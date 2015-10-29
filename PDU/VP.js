'use strict';

var PDU     = require('../pdu'),
    sprintf = require('sprintf');
    
function VP(submit)
{
    /**
     * date time validity period
     * @var string|null
     */
    this._datetime;
    
    /**
     * inteval validity period
     * @var integer|null
     */
    this._interval;
    
    /**
     * pdu message
     * @var Submit
     */
    this._pdu = submit;
};


/**
 * parse pdu string
 * @param PDU submit
 * @return VP
 * @throws Error
 */
VP.parse = function(submit)
{
    var SCTS = PDU.getModule('PDU/SCTS'),
        Type = PDU.getModule('PDU/Type');
    
    var vp = new VP(submit);
    
    switch(submit.getType().getVpf()){
        case Type.VPF_NONE:     return vp;
        case Type.VPF_ABSOLUTE: return SCTS.parse();
        
        case Type.VPF_RELATIVE:
            
            var buffer = new Buffer(PDU.getPduSubstr(2), 'hex'),
                byte   = buffer[0];
            
            if(byte <= 143){
                vp._interval = (byte+1) * (5*60);
            } else if(byte <= 167){
                vp._interval = (3600*24*12) + (byte-143) * (30*60);
            } else if(byte <= 196) {
                vp._interval = (byte-166) * (3600*24);
            } else {
                vp._interval = (byte-192) * (3600*24*7);
            }
            
            return vp;
        
        default:
            throw new Error("Unknown VPF");
    }
};

/**
 * getter for pdu message
 * @return PDU
 */
VP.prototype.getPdu = function()
{
    return this._pdu;
};

/**
 * set date time
 * @param string datetime
 */
VP.prototype.setDateTime = function(datetime)
{
    this._datetime = new Date(Date.parse(datetime));
};

/**
 * set interval
 * @param type interval
 */
VP.prototype.setInterval = function(interval)
{
    this._interval = interval;
};

/**
 * cast to string
 * @return string
 */
VP.prototype.toString = function()
{
    var SCTS = PDU.getModule('PDU/SCTS'),
        Type = PDU.getModule('PDU/Type');

    // get pdu type
    var type = this.getPdu().getType();
    
    // absolute value
    if(this._datetime){
        type.setVpf(Type.VPF_ABSOLUTE);
        return (new SCTS(this._datetime)).toString();
    }
    
    // relative value in seconds
    if(this._interval){
        type.setVpf(Type.VPF_RELATIVE);
        
        var minutes = Math.ceil(this._interval / 60),
            hours   = Math.ceil(this._interval / 60 / 60),
            days    = Math.ceil(this._interval / 60 / 60 / 24),
            weeks   = Math.ceil(this._interval / 60 / 60 / 24 / 7);
        
        if(hours <= 12){
            return sprintf("%02X", Math.ceil(minutes/5)-1);
        } else if(hours <= 24){
            return sprintf("%02X", Math.ceil((minutes-720)/30)+143);
        } else if(hours <= (30*24*3600)) {
            return sprintf("%02X", days+166);
        } else {
            return sprintf("%02X", (weeks > 63 ? 63 : weeks)+192);
        }
    }
    
    // vpf not used
    type.setVpf(Type.VPF_NONE);
    
    return "";
};


module.exports = VP;