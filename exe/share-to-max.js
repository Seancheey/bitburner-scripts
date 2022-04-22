/** @param {NS} ns **/
export async function main(ns) {
	const shareScript = '/exe/share.script'
	const host = ns.getHostname()
	ns.exec(shareScript, host, Math.floor((ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) / ns.getScriptRam(shareScript)))
}