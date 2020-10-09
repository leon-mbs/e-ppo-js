const jkurwa = require('jkurwa');
const gost89 = require("gost89");
const buffer = require("Buffer");
const encoding = require('encoding');
const rfc3161 = require('jkurwa/lib/spec/rfc3161-tsp');
const dstszi2010 = require('jkurwa/lib/spec/dstszi2010');
const { Message } = require('jkurwa/lib/models');
const { Priv, Certificate } = require('jkurwa/lib/models');
const transport = require('jkurwa/lib/util/transport');
//const xml2js  = require('xml2js');

window.require = require;