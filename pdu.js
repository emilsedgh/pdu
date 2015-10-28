'use strict';

var SCA    = require('./PDU/SCA'),
	Helper = require('./PDU/Helper'),
	util   = require('util');

function PDU()
{
	/**
	 * Service Centre Address
	 * @var SCA
	 */
	this._sca;
	
	/**
	 * Transport Protocol Data Unit
	 * @var Type
	 */
	this._type;
	
	/**
	 * Originator or Destination Address
	 * @var SCA
	 */
	this._address;
	
	/**
	 * Protoсol Identifier
	 * @var PID
	 */
	this._pid;
	
	/**
	 * Data Coding Scheme
	 * @var DCS
	 */
	this._dcs;
	
	/**
	 * User Data Length
	 * @var integer
	 */
	this._udl;
	
	/**
	 * User Data
	 * @var string
	 */
	this._ud;
	
	this.setSca();
	this.initType();
	this.setPid();
	this.setDcs();
	
};

/**
 * parsed string
 * @var string
 */
PDU._pduParse = '';

/**
 * get a part pdu string and cut them from pdu
 * @param integer length
 * @return string
 */
PDU.getPduSubstr = function(length)
{
	var str = PDU._pduParse.substr(0, length);
	PDU._pduParse = PDU._pduParse.substr(length);
	return str;
};

/**
 * parse pdu string
 * @param string str
 * @return PDU
 * @throws Error
 */
PDU.parse = function(str)
{
	// current pdu string
	PDU._pduParse = str;

	// parse service center address
	var sca = SCA.parse(false);
		
	// parse type of sms
	var self = Helper.getPduByType();
		
	// set sca
	self._sca = sca;
		
	// parse sms address
	self._address = SCA.parse();
		
	return Helper.initVars(self);
};

/**
 * getter for udl
 * @return integer
 */
PDU.prototype.getUdl = function()
{
	return this._udl;
};

/**
 * setter for user data length
 * @param integer udl
 */
PDU.prototype.setUdl = function(udl)
{
	this._udl = udl;
};

/**
 * set sms center
 * @param string|null|SCA address
 * @return PDU
 */
PDU.prototype.setSca = function(address)
{

	if(address instanceof SCA){
		this._sca = address;
		return this;
	}

	if( ! this._sca){
		this._sca = new SCA(false);
	}

	if(address){
		this._sca.setPhone(address, true);
	}

	return this;
};

/**
 * getter for SCA
 * @return SCA
 */
PDU.prototype.getSca = function()
{
	return this._sca;
};

module.exports = PDU;

