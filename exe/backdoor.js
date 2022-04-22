/** @param {NS} ns */
import { connectx } from "/lib/connect.js"

export async function installBackdoorOnAllServers(ns) {
	const currentServer = ns.getHostname()
	const criticalServers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets", "zb-institute"]
	if (ns.getPlayer().bitNodeN != 10 || ns.sleeve.getNumSleeves() == 8) {
		// For bitnode 10, we also need to purchase sleeves.. So don't automatically backdoor daemon
		criticalServers.push("w0r1d_d43m0n")
	}
	const vulnerableServers = criticalServers
		.filter(name => {
			const server = ns.getServer(name)
			return server.hasAdminRights && !server.backdoorInstalled && !server.purchasedByPlayer
		})
	for (const serverName of vulnerableServers) {
		ns.tprint("installing backdoor on server '" + serverName + "'")
		connectx(ns, serverName)
		await ns.installBackdoor()
	}
	connectx(ns, currentServer)
}

export async function main(ns) {
	await installBackdoorOnAllServers(ns)
}