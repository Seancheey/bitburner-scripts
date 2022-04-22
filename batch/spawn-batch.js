/** @param {NS} ns **/

import { getOptimalGrowTime, getOptimalHackTime, getOptimalWeakenTime, getBatchRam, getOptimalGrowPercent } from "/lib/analysis.js"

export async function spawnBatch(ns, target, attacker, h, g, w) {
	function serverAtBestState() {
		return ns.getServerSecurityLevel(target) == minSecurity && ns.getServerMoneyAvailable(target) == maxMoney
	}
	function now() {
		return new Date().getTime()
	}
	function ramLeft() {
		return ns.getServerMaxRam(attacker) - ns.getServerUsedRam(attacker)
	}
	const delayMs = 100
	const hackScript = "/batch/hack.js"
	const growScript = "/batch/grow.js"
	const weakenScript = "/batch/weaken.js"
	const scriptRam = Object.assign({},
		{ [hackScript]: ns.getScriptRam(hackScript) },
		{ [growScript]: ns.getScriptRam(growScript) },
		{ [weakenScript]: ns.getScriptRam(weakenScript) },
	)
	const minSecurity = ns.getServerMinSecurityLevel(target)
	const maxMoney = ns.getServerMaxMoney(target)
	async function recoverToBestState() {
		const growthPercent = 2 ** (1 / ns.growthAnalyze(target, /*growScale=*/ 2, ns.getServer(attacker).cpuCore))
		let projectedServerMoney = ns.getServerMoneyAvailable(target)
		let projectedSecurity = ns.getServerSecurityLevel(target)
		for (let i = -1; projectedSecurity > minSecurity || projectedServerMoney < maxMoney; i--) {
			ns.print("projected stats: " + (projectedServerMoney / maxMoney * 100) + "% <money security>" + projectedSecurity)
			if (projectedServerMoney < maxMoney) {
				ns.print("spawn grow to recover to best state." + i)
				if (ns.exec(growScript, attacker, g, target, i)) {
					projectedServerMoney *= growthPercent ** g
					projectedSecurity += 0.004 * g
				}
			}
			if (projectedSecurity > minSecurity) {
				ns.print("spawn weaken to recover to best state." + i)
				if (ns.exec(weakenScript, attacker, w, target, i) > 0) {
					projectedSecurity -= 0.05 * w
				}
			}
			await ns.sleep(1000)
		}
		if (!serverAtBestState()) {
			await ns.sleep(Math.max(ns.getWeakenTime(target), ns.getGrowTime(target)) + 1000)
		}
		if (!serverAtBestState()) {
			ns.print("weird.. server still not at best state. try again...")
			await recoverToBestState()
		}
	}
	await recoverToBestState()
	const growTime = getOptimalGrowTime(ns, target)
	const hackTime = getOptimalHackTime(ns, target)
	const weakenTime = getOptimalWeakenTime(ns, target)
	const times = [growTime, hackTime, weakenTime]
	const minTime = Math.min(...times)
	const batchRam = getBatchRam(ns, h, g, w)
	const minTimeScript = (minTime == growTime) ? growScript : ((minTime == hackTime) ? hackScript : weakenScript)
	const maxBatchNumToQueue = Math.floor(minTime / (delayMs * 4))
	ns.print("max batch num to queue is " + maxBatchNumToQueue + " (" + minTimeScript + ")")
	const w1 = Math.ceil(h / 25)
	const w2 = w - w1
	if (w2 == 0) {
		ns.print("HGW's second W is 0, exiting")
		ns.exit()
	}
	const scheduleQueue = []
	let ramPreoccupied = 0
	let batchId = 1
	let finishTime = now() + Math.max(...times) + 1000 // 1sec leeway
	let enqueuedMinTimeScript = 0
	function canEnque() {
		const usableRam = ramLeft() - ramPreoccupied
		if (usableRam < batchRam) {
			// ns.print("usable RAM is not enough for a batch")
			return false;
		}
		return enqueuedMinTimeScript < maxBatchNumToQueue
	}
	function enqueBatch() {
		while (canEnque()) {
			while ((finishTime - Math.max(...times)) < now() + delayMs) {
				// ns.print("queue by adding extra finish time... current queue size = " + scheduleQueue.length)
				finishTime += delayMs * 4
			}
			scheduleQueue.push({ id: batchId + ".", script: hackScript, thread: h, start: finishTime - hackTime })
			finishTime += delayMs
			scheduleQueue.push({ id: batchId + " .", script: weakenScript, thread: w1, start: finishTime - weakenTime })
			finishTime += delayMs
			scheduleQueue.push({ id: batchId + "  .", script: growScript, thread: g, start: finishTime - growTime })
			finishTime += delayMs
			scheduleQueue.push({ id: batchId + "   .", script: weakenScript, thread: w2, start: finishTime - weakenTime })
			finishTime += delayMs
			ramPreoccupied += batchRam
			batchId++
			if (minTimeScript == weakenScript) {
				enqueuedMinTimeScript += 2
			} else {
				enqueuedMinTimeScript++;
			}
		}
		scheduleQueue.sort((a, b) => a.start - b.start)
	}

	await ns.scp([hackScript, weakenScript, growScript], attacker)

	while (true) {
		const start = now()
		enqueBatch()
		if (scheduleQueue.length > 0) {
			const schedule = scheduleQueue.shift()
			if (schedule.script == minTimeScript) {
				enqueuedMinTimeScript--;
			}
			ramPreoccupied -= scriptRam[schedule.script] * schedule.thread
			const sleepTime = schedule.start - now()
			// ns.print("sleep " + sleepTime)
			if (sleepTime < 0) {
				ns.print("Server sleep time is smaller than 0 (=" + sleepTime + ")!! this behavior could lead to unsynced batch")
			}
			await ns.sleep(sleepTime)
			if (!serverAtBestState() && schedule.id > 0) {
				if (schedule.script == weakenScript) {
					let succeed = false
					for (const tryNum = 0; tryNum < 10 && !succeed; tryNum++) {
						ns.print("Server is not at best state. delaying all scripts to try to sync repeat=" + tryNum)
						await ns.sleep(delayMs)
						if (serverAtBestState()) {
							ns.print("Server restored to best state after " + tryNum + " tries.")
							for (const schedule of scheduleQueue) {
								schedule.start += delayMs
							}
							succeed = true;
						}
					}
					if (!succeed) {
						ns.print("Server still not at best state after max tries. skipping" + schedule.id + schedule.script)
						continue
					}
				} else {
					ns.print("Server is not at best state. Dropping schedule " + schedule.id + schedule.script)
					continue
				}
			}
			ns.exec(schedule.script, attacker, schedule.thread, target, schedule.id)
		} else {
			ns.print("empty queue. waiting..")
			await ns.sleep(1000)
		}
		// ns.print("loop time elapsed = " + (now() - start))
	}
}

export async function main(ns) {
	ns.disableLog('ALL')
	await spawnBatch(ns, ...ns.args)
}