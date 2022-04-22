/** @param {NS} ns */

// import * as corp from 'corp.js'
import {forceSpawnElsewhere} from '/exe/force-spawn.js'
import {findAllServers} from '/lib/find-all-servers.js'


async function test(ns) {
	const deps = ns.ls('home').filter(f => f.includes('.js') && (f.includes('lib/') || f.includes('exe/')))
	return await forceSpawnElsewhere(ns, 'sleeve.js', Array.from(findAllServers(ns)), deps)
}

export async function main(ns) {
	ns.tail()
	// ns.print(corp.getCycleMaxWarehouseUsage(ns, ns.corporation.getDivision("RealEstate"), "Sector-12"))
	// await corp.investMoney(ns)
	// ns.print(h.spendHash(ns))
	ns.print(await test(ns))
}