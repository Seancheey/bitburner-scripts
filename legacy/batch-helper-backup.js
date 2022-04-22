import { getOptimalWeakenTime, getOptimalHackTime, getOptimalGrowTime } from 'lib/analysis.js'

/** @param {NS} ns **/
export async function main(ns) {
	const target = ns.args[0]
	const attacker = ns.args[1]
	const h = ns.args[2]
	const g = ns.args[3]
	const w = ns.args[4]
	const scriptNum = ns.args[5]
	const leftH = ns.args[6]
	const leftG = ns.args[7]
	const leftW = ns.args[8]
	const hackScript = '/exe/forever-hack.script'
	const growScript = '/exe/forever-grow.script'
	const weakenScript = '/exe/forever-weaken.script'
	const shareScript = '/exe/share.script'

	function tryRun(script, thread, i) {
		if (thread == 0) {
			return;
		}
		if (!ns.serverExists(attacker)) {
			ns.print("can't find attacker server named: " + attacker)
			ns.exit()
		}
		const ramLeft = ns.getServerMaxRam(attacker) - ns.getServerUsedRam(attacker)
		if (ramLeft < ns.getScriptRam(script)) {
			ns.print("Unable to spawn " + thread + " threads of " + script + " due to low RAM")
			return;
		}
		const maxI = 10000
		while (ns.exec(script, attacker, thread, target, i) == 0) {
			if (i >= maxI) {
				break;
			}
			i++
		}
	}

	// TODO: should spawn HGW threads with equal time interval
	ns.toast("begin to attack " + target + " through " + attacker)
	await ns.scp([hackScript, growScript, weakenScript, shareScript], attacker)
	let i = 0;
	const weakenSleep = getOptimalWeakenTime(ns, target) / scriptNum
	for (i = 0; i < scriptNum; i++) {
		tryRun(weakenScript, w, i)
		await ns.sleep(weakenSleep)
	}
	const growSleep = getOptimalGrowTime(ns, target) / scriptNum
	for (i = 0; i < scriptNum; i++) {
		tryRun(growScript, g, i)
		await ns.sleep(growSleep)
	}
	const hackSleep = getOptimalHackTime(ns, target) / scriptNum
	for (i = 0; i < scriptNum; i++) {
		tryRun(hackScript, h, i)
		await ns.sleep(hackSleep)
	}
	i++
	tryRun(hackScript, leftH, i)
	tryRun(growScript, leftG, i)
	tryRun(weakenScript, leftW, i)

	const ramLeft = ns.getServerMaxRam(attacker) - ns.getServerUsedRam(attacker)
	const sgwRam = ns.getScriptRam(shareScript) * 5 + ns.getScriptRam(growScript) * 10 + ns.getScriptRam(weakenScript)
	const sgwNum = Math.floor(ramLeft / sgwRam)
	i++
	tryRun(shareScript, sgwNum * 5, i)
	tryRun(weakenScript, sgwNum, i)
	tryRun(growScript, sgwNum * 10, i)
}