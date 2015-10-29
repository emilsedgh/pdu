'use strict';

var PDU     = require('../pdu'),
    sprintf = require('sprintf');
    
function SCTS(date)
{
    /**
     * unix time
     * @var integer
     */
    this._time = date.getTime() / 1000;
}

/**
 * parse pdu string
 * @return SCTS
 */
SCTS.parse = function()
{
    var hex    = PDU.getPduSubstr(14),
        params = ["20%02d-%02d-%02d %02d:%02d:%02d"];

        hex.match(/.{1,2}/g).map(function(s){
            params.push(
                parseInt(
                    s.split("").reverse().join("")
                )
            );
        });
    
    var time = Date.parse(sprintf.apply(sprintf, params)),
        date = new Date(time);
    
    return new SCTS(date);
};

/**
 * getter time
 * @return integer
 */
SCTS.prototype.getTime = function()
{
    return this._time;
};

/**
 * format datatime for split
 * @return string
 */
SCTS.prototype._getDateTime = function()
{
    var dt = new Date(this.getTime() * 1000);
    return printf(
        '%02d%02d%02d%02d%02d%02d00', 
        dt.getYear(),
        dt.getMonth() + 1,
        dt.getDate(),
        dt.getHours(),
        dt.getMinutes(),
        dt.getSeconds()
    );
};

/**
 * cast to string
 * @return string
 */
SCTS.prototype.toString = function() 
{
    
    return this._getDateTime()
        .match(/.{1,2}/g)
        .map(function(s){
            return parseInt(
                s.split("").reverse().join("")
            );
        }).join("");
};


module.exports = SCTS;