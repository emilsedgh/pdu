'use strict';

var PDU     = require('./pdu'),
    sprintf = require('sprintf'),
    util    = require('util');
    
function Report()
{
    
    Report.super_.apply(this, arguments);
    
    /**
     * referenced bytes
     * @var integer
     */
    this._reference;
    
    /**
     * datetime
     * @var SCTS
     */
    this._timestamp;
    
    /**
     * datetime
     * @var SCTS
     */
    this._discharge;
    
    /**
     * report status
     * 0x00 Short message received succesfully
     * 0x01 Short message forwarded to the mobile phone, but unable to confirm delivery
     * 0x02 Short message replaced by the service center
     * 0x20 Congestion
     * 0x21 SME busy
     * 0x22 No response from SME
     * 0x23 Service rejected
     * 0x24 Quality of service not available
     * 0x25 Error in SME
     * 0x40 Remote procedure error
     * 0x41 Incompatible destination
     * 0x42 Connection rejected by SME
     * 0x43 Not obtainable
     * 0x44 Quality of service not available
     * 0x45 No interworking available
     * 0x46 SM validity period expired
     * 0x47 SM deleted by originating SME
     * 0x48 SM deleted by service center administration
     * 0x49 SM does not exist
     * 0x60 Congestion
     * 0x61 SME busy
     * 0x62 No response from SME
     * 0x63 Service rejected
     * 0x64 Quality of service not available
     * 0x65 Error in SME
     * 
     * @var integer
     */
    this._status;
};

util.inherits(Report, PDU);

/**
 * set pdu type
 * @param array $params
 */
Report.prototype.initType = function(params)
{
    var ReportType = require('./PDU/Type/Report');
    this._type = new ReportType(params || []);
};

/**
 * get a referenced bytes
 * @return integer
 */
Report.prototype.getReference = function()
{
    return this._reference;
};

/**
 * setter for reference
 * @param integer reference
 */
Report.prototype.setReference = function(reference)
{
    this._reference = reference;
};

/**
 * 
 * @return SCTS
 */
Report.prototype.getDateTime = function()
{
    return this._timestamp;
};

/**
 * setter timestamp
 * @param string|int timestamp
 */
Report.prototype.setDateTime = function(timestamp)
{
    this._timestamp = timestamp;
};

/**
 * 
 * @return SCTS
 */
Report.prototype.getDischarge = function()
{
    return this._discharge;
};

/**
 * setter for discharge
 * @param string|int discharge
 */
Report.prototype.setDischarge = function(discharge)
{
    this._discharge = discharge;
};

/**
 * status report
 * @return integer
 */
Report.prototype.getStatus = function()
{
    return this._status;
};

/**
 * setter for status
 * @param integer $status
 */
Report.prototype.setStatus = function(status)
{
    this._status = status;
};

Report.prototype.getStart = function()
{
    return null;
};

module.exports = Report;