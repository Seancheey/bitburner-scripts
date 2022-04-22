/** @param {NS} ns **/
export function tryRoot(ns, hostname) {
	const openPortScripts = {}
	openPortScripts["BruteSSH.exe"] = ns.brutessh
	openPortScripts["FTPCrack.exe"] = ns.ftpcrack
	openPortScripts["relaySMTP.exe"] = ns.relaysmtp
	openPortScripts["HTTPWorm.exe"] = ns.httpworm
	openPortScripts["SQLInject.exe"] = ns.sqlinject

	ns.disableLog('ALL');

	if (ns.hasRootAccess(hostname)) {
		return true;
	}

	var numScripts = 0;
	for (const script in openPortScripts) {
		if (ns.fileExists(script, "home")) {
			numScripts++;
			openPortScripts[script](hostname);
		}
	}
	if (numScripts >= ns.getServerNumPortsRequired(hostname)) {
		ns.nuke(hostname);
		return true;
	}
	return false;
}