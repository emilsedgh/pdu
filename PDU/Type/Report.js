'use strict';

var PDU     = require('../../pdu'),
    Type    = require('../Type'),
    sprintf = require('sprintf'),
    util    = require('util');
    
function Report(params)
{
    Report.super_.apply(this, arguments);
    
    params     = params || {};
    
    this._rp   = params.rp   ? 1 & params.rp   : 0;
    this._udhi = params.udhi ? 1 & params.udhi : 0;
    this._srr  = params.srr  ? 1 & params.srr  : 0;

    //More Message to Send
    this._rd   = params.mms  ? 1 & params.mms  : 0;
    this._mti  = 0x02; // SMS-REPORT
    this._vpf  = 0x00; // not used
}


util.inherits(Report, Type);

module.exports = Report;