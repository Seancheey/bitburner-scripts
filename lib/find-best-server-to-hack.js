import { getProfitabilityScore } from 'lib/analysis.js'
import { findAllServers } from 'lib/find-all-servers.js'

/** @param {NS} ns **/
export function findBestServerToHack(ns) {
	var best = 'n00dles'
	var bestScore = 0.00001
	for (let server of findAllServers(ns)) {
		if (!ns.hasRootAccess(server)) {
			continue
		}
		const score = getProfitabilityScore(ns, server)
		if (score > bestScore && server != 'home') {
			bestScore = score
			best = server
		}
	}
	// ns.print("best is " + best)
	return best
}

export function findBestServersToHackWithScore(ns) {
	return Array.from(findAllServers(ns)).map(
		(server) => { return { server: server, score: getProfitabilityScore(ns, server) } }
	).filter(
		tup => tup.score > 0 && ns.hasRootAccess(tup.server)
	).sort(
		(a, b) => b.score - a.score
	)
}

export function findBestServersToHack(ns) {
	return findBestServersToHackWithScore(ns).map(
		tup => tup.server
	)
}

export async function main(ns) {
	ns.disableLog('ALL')
	ns.tprintf("Server:\n%s", findBestServersToHackWithScore(ns).map(tup => tup.server + ": " + tup.score).join('\n'))
}