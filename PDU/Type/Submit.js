'use strict';

var PDU     = require('../../pdu'),
    Type    = require('../Type'),
    sprintf = require('sprintf'),
    util    = require('util');
    
function Submit(params)
{
    Submit.super_.apply(this, arguments);
    
    params     = params || {};
    
    this._rp   = params.rp   ? 1 & params.rp   : 0;
    this._udhi = params.udhi ? 1 & params.udhi : 0;
    this._srr  = params.srr  ? 1 & params.srr  : 0;
    this._vpf  = params.vpf  ? 3 & params.vpf  : 0;
    this._rd   = params.rd   ? 1 & params.rd   : 0;
    this._mti  = 0x01; // SMS-SUBMIT
}


util.inherits(Submit, Type);

module.exports = Submit;