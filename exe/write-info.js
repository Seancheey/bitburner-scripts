/** @param {NS} ns */

import * as is from '/lib/info-store.js'

export async function main(ns) {
	is.writeInfo(ns, is.BIT_NODE_MULTS, ns.getBitNodeMultipliers())
}