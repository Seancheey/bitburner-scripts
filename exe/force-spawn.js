/** @param {NS} ns **/

import { findAllServers } from '/lib/find-all-servers.js'

export async function forceSpawnElsewhere(ns, script, allServers, deps, ...args) {
	const scriptRam = ns.getScriptRam(script)
	const host = ns.getHostname()
	ns.print("Unable to spawn " + script + " at " + host + " due to low RAM. Try to find another server to run " + script)

	const executor = allServers.filter(server =>
		ns.getServerMaxRam(server) >= scriptRam && ns.hasRootAccess(server) && server != host
	).reduce((a, b) => (a == null || ns.getServerMaxRam(a) > ns.getServerMaxRam(b)) ? b : a, null)
	ns.print(executor)
	if (executor) {
		ns.print("Executed " + script + " at server " + executor + " instead")
		await ns.scp(script, host, executor)
		if (deps.length > 0) {
			await ns.scp(deps, host, executor)
		}
		ns.killall(executor)
		const pid = ns.exec(script, executor, 1, ...args)
		return pid > 0
	} else {
		ns.print("Unable to find a server with " + scriptRam + "GB of ram. " + script + " execution failed.")
		return false
	}
}

export async function forceSpawn(ns, script, extraDeps, ...args) {
	extraDeps = extraDeps || []
	const scriptRam = ns.getScriptRam(script)
	const host = ns.getHostname()
	const allServers = Array.from(findAllServers(ns))

	if (allServers.some(server => ns.scriptRunning(script, server))) {
		ns.print(script + " is already running somewhere.")
		return true
	}

	if (scriptRam < ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) {
		ns.print("Spawning " + script + " at " + host)
		return ns.exec(script, host, 1, ...args) > 0
	} else {
		const deps = ns.ls('home').filter(f => f.includes('.js') && (f.includes('lib/') || f.includes('exe/'))).concat(extraDeps)
		return await forceSpawnElsewhere(ns, script, allServers, deps, ...args)
	}
}

export async function main(ns) {
	await forceSpawn(ns, ns.args[0], ns.args[1], ns.args.slice(2))
}