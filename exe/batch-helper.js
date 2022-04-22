import { getOptimalHackTime } from 'lib/analysis.js'

export function tryRun(ns, script, attacker, thread, target, i) {
	if (thread == 0) {
		return false;
	}
	if (!ns.serverExists(attacker)) {
		ns.print("can't find attacker server named: " + attacker)
		ns.exit()
	}
	const ramLeft = ns.getServerMaxRam(attacker) - ns.getServerUsedRam(attacker)
	if (ramLeft < ns.getScriptRam(script)) {
		ns.print("Unable to spawn " + thread + " threads of " + script + " due to low RAM")
		return false;
	}
	const maxI = 10000
	while (ns.exec(script, attacker, thread, target, i) == 0) {
		if (i >= maxI) {
			return false;
		}
		i++
	}
	ns.print("Ran script " + script + " with " + thread + " threads.")
	return true;
}

export async function executeBatch(ns, target, attacker, h, g, w, hs, gs, ws, reserveRam) {
	const hackScript = '/exe/forever-hack.script'
	const growScript = '/exe/forever-grow.script'
	const weakenScript = '/exe/forever-weaken.script'
	const shareScript = '/exe/share.script'
	const minSpawnInterval = 2500

	const spawnIntervalTime = Math.max(getOptimalHackTime(ns, target) / hs, minSpawnInterval)

	ns.toast("begin to attack " + target + " through " + attacker)
	await ns.scp([hackScript, growScript, weakenScript, shareScript], attacker)

	function tryRunLocal(script, thread, i) {
		tryRun(ns, script, attacker, thread, target, i)
	}
	async function spawnScripts(script, threadNum, scriptNum) {
		let i = 0
		let s = scriptNum;
		while (s > 1) {
			tryRunLocal(script, threadNum, i)
			await ns.sleep(spawnIntervalTime);
			i++;
			s--;
		}
		tryRunLocal(script, threadNum, i)
	}
	await spawnScripts(weakenScript, w, ws)
	await spawnScripts(growScript, g, gs)
	const moneyPercentThreshold = 0.6 + Math.random() * 0.35
	while (ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target) < moneyPercentThreshold) {
		if (!ns.serverExists(attacker)) {
			ns.print("can't find attacker server named: " + attacker)
			ns.exit()
		}
		await ns.sleep(5000)
	}
	await spawnScripts(hackScript, h, hs)

	// fill the rest RAM with share script
	const ramLeft = ns.getServerMaxRam(attacker) - ns.getServerUsedRam(attacker) - reserveRam
	const thread = Math.floor(ramLeft / ns.getScriptRam(shareScript))
	if (thread > 0) {
		await ns.exec(shareScript, attacker, thread)
	}
}

export async function main(ns) {
	await executeBatch(ns, ...ns.args)
}