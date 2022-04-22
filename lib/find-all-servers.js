/** @param {NS} ns **/

export function findAllServers(ns, start) {
	start = start || 'home';
	var servers = new Set([start])
	function helper(hostname) {
		const neighbors = ns.scan(hostname)
		for (const n of neighbors) {
			if (!servers.has(n)) {
				servers.add(n)
				helper(n)
			}
		}
	}
	helper(start)
	return servers;
}

export function findAllRootAccessServers(ns){
	return Array.from(findAllServers(ns)).filter(s => ns.hasRootAccess(s))
}

export async function main(ns){
	ns.tprint(Array.from(findAllServers(ns)).join("\n"))
	// ns.toast(Array.from(findAllServers(ns)), 'info', 60000)
}