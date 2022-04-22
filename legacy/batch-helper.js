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

	if(scriptNum == 0 && leftH == 0 && leftG == 0 && leftW == 0){
		ns.print("Script has nothing to spawn. exit.")
		return;
	}

	const hackTime = getOptimalHackTime(ns, target)
	const growTime = getOptimalGrowTime(ns, target)
	const weakenTime = getOptimalWeakenTime(ns, target)

	// try to make sleep time of GW threads to equal to H 
	const totalG = g * scriptNum + leftG
	const totalW = w * scriptNum + leftW
	const totalH = h * scriptNum + leftH
	const cycleTime = hackTime
	const spawnIntervalTime = hackTime / scriptNum
	// nG * (growTime/spawnIntervalTime) = totalG
	const newG = Math.round(totalG / growTime * spawnIntervalTime)
	const newW = Math.round(totalW / weakenTime * spawnIntervalTime)


	ns.toast("begin to attack " + target + " through " + attacker)
	await ns.scp([hackScript, growScript, weakenScript, shareScript], attacker)


	// spawn grow and weaken threads first, this way we can make sure the server is at best status when we begin to hack.
	let totalGLeft = totalG
	let totalWLeft = totalW
	let i = 0;
	while (totalGLeft >= newG || totalWLeft >= newW) {
		if (newG <= totalGLeft && tryRun(growScript, newG, i)) {
			totalGLeft -= newG;
		}
		if (newW <= totalWLeft && tryRun(weakenScript, newW, i)) {
			totalWLeft -= newW;
		}
		i++;
		await ns.sleep(spawnIntervalTime);
	}
	if (totalGLeft > 0) {
		tryRun(growScript, totalGLeft, i)
		totalGLeft = 0
	}
	if (totalWLeft > 0) {
		tryRun(weakenScript, totalWLeft, i)
		totalWLeft = 0
	}
	// after grow and weaken threads are spawned, spawn hack script then.
	let totalHLeft = totalH
	i = 0
	while (totalHLeft >= h) {
		tryRun(hackScript, h, i)
		totalHLeft -= h
		i++;
	}
	tryRun(hackScript, totalHLeft, i);


	const ramLeft = ns.getServerMaxRam(attacker) - ns.getServerUsedRam(attacker)
	const sgwRam = ns.getScriptRam(shareScript) * 5 + ns.getScriptRam(growScript) * 10 + ns.getScriptRam(weakenScript)
	const sgwNum = Math.floor(ramLeft / sgwRam)
	i++
	tryRun(shareScript, sgwNum * 5, i)
	tryRun(weakenScript, sgwNum, i)
	tryRun(growScript, sgwNum * 10, i)
}