import { findAllServers } from 'lib/find-all-servers.js'
import { findBestServerToHack } from 'lib/find-best-server-to-hack.js'
import { tryRoot } from 'lib/try-root.js'
import { spawnBatchAttack, getOptimalHackTime, getOptimalGrowTime, getOptimalWeakenTime } from 'lib/analysis.js'
import { execToMaxRam } from 'lib/exec-to-max-ram.js'

export async function deployOnServer(ns, target, attacker, forceKillAll = false, estimateMaxActionPerSec = 500) {
	const earlyGameHackScript = '/exe/exploit.js'
	const lateGameHackScript = '/exe/batch-helper.js'
	const maxScriptNumCap = 122
	const homeReserveRam = ns.getScriptRam('corp.js') + ns.getScriptRam(lateGameHackScript) * 30

	let reserveRam = 0
	if (attacker == 'home') {
		reserveRam = homeReserveRam
	}

	if (forceKillAll && attacker != ns.getHostname()) {
		ns.killall(attacker);
	}

	const spawner = ns.getHostname()
	if (ns.getServerMaxRam(attacker) >= 128 && ((ns.getServerMaxRam(spawner) - ns.getServerUsedRam(spawner) > ns.getScriptRam(lateGameHackScript)) || ns.getServerMaxRam(attacker) >= 256)) {
		const maxScriptNum = Math.min(maxScriptNumCap, Math.round(estimateMaxActionPerSec / 1000 * ((getOptimalGrowTime(ns, target) + getOptimalHackTime(ns, target) + getOptimalWeakenTime(ns, target)) / 3) / 26)) // 25 server + 1 home

		await spawnBatchAttack(ns, target, attacker, reserveRam, maxScriptNum)
	} else {
		if (attacker == 'home') {
			return;
		}
		const threadCountForEachScript = Math.max(Math.min(10, Math.round(ns.getServerMaxRam(attacker) / 200)), 10)
		await execToMaxRam(ns, earlyGameHackScript, attacker, threadCountForEachScript, target, threadCountForEachScript, ns.hackAnalyze(target), ns.getServerMinSecurityLevel(target), ns.getServerMaxMoney(target))
	}
}

export async function deployAll(ns, forceRestartAllServer = false) {
	var servers = findAllServers(ns, 'home')
	const serverCount = servers.size;
	var successCount = 0;
	var lowRamCount = 0;
	var failRootCount = 0;

	// try root all servers
	servers = Array.from(servers).filter(s => {
		const rootable = tryRoot(ns, s)
		if (!rootable) {
			failRootCount++;
		}
		return rootable;
	})

	// install exploit on all rooted servers.
	const bestToHack = findBestServerToHack(ns, servers)
	ns.toast("Best target found to be '" + bestToHack + "'", 'info', 10000);
	for (const attacker of servers) {
		await deployOnServer(ns, bestToHack, attacker, forceRestartAllServer);
		successCount++;
	}
	if (lowRamCount) {
		ns.toast("Failed to execute due to low RAM on " + lowRamCount + "/" + serverCount + " servers", 'info', 10000);
	}
	if (failRootCount) {
		ns.toast("Failed to execute due to unrootable on " + failRootCount + "/" + serverCount + " servers", 'info', 10000);
	}
	if (successCount) {
		ns.toast("Successfully executed exploit on " + successCount + " servers out of " + serverCount + " servers", 'success', 10000);
	}
}

export async function main(ns) {
	await deployAll(ns, ...ns.args)
}