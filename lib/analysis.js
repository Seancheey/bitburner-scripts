/** @param {NS} ns **/

const securityRaiseByGrow = 0.004
const securityRaiseByHack = 0.002
const securityReduceByWeaken = 0.05
// i.e. 25 hack = 1 weaken = 12.5 grow

const hackScriptRam = 1.7
const growScriptRam = 1.75
const weakenScriptRam = 1.75

export function hasFormulas(ns) {
	return ns.fileExists("Formulas.exe", "home")
}

export function getOptimalServer(ns, target, securityAdd = 0) {
	const server = ns.getServer(target)
	server.hackDifficulty = ns.getServerMinSecurityLevel(target) + securityAdd
	server.moneyAvailable = ns.getServerMaxMoney(target)
	return server
}

export function getOptimalHackPercent(ns, target) {
	if (!hasFormulas(ns)) {
		return ns.hackAnalyze(target)
	}
	const server = getOptimalServer(ns, target)
	return ns.formulas.hacking.hackPercent(server, ns.getPlayer())
}

export function getOptimalGrowPercent(ns, target, attacker) {
	const attackerCpu = ns.getServer(attacker).cpuCores
	if (!hasFormulas(ns)) {
		const callNumToDouble = ns.growthAnalyze(target, /*growScale=*/ 2, attackerCpu)
		// (1+x)^N = 2, 1+x = 2^(1/n), x = 2^(1/n) - 1
		return 2 ** (1 / callNumToDouble)
	}
	const server = getOptimalServer(ns, target)
	return ns.formulas.hacking.growPercent(server, 1, ns.getPlayer(), attackerCpu)
}

export function getOptimalHackChance(ns, target) {
	if (!hasFormulas(ns)) {
		return ns.hackAnalyzeChance(target)
	}
	const server = getOptimalServer(ns, target)
	return ns.formulas.hacking.hackChance(server, ns.getPlayer())
}

export function getOptimalHackTime(ns, target) {
	if (!hasFormulas(ns)) {
		return ns.getHackTime(target)
	}
	const server = getOptimalServer(ns, target)
	return ns.formulas.hacking.hackTime(server, ns.getPlayer())
}

export function getOptimalGrowTime(ns, target) {
	if (!hasFormulas(ns)) {
		return ns.getGrowTime(target)
	}
	const server = getOptimalServer(ns, target)
	return ns.formulas.hacking.growTime(server, ns.getPlayer())
}

export function getOptimalWeakenTime(ns, target) {
	if (!hasFormulas(ns)) {
		return ns.getWeakenTime(target)
	}
	const server = getOptimalServer(ns, target)
	return ns.formulas.hacking.weakenTime(server, ns.getPlayer())
}

export function getProfitPerRamSec(ns, target, hackThread, growThread, weakenThread, attacker = 'home') {
	// HGW threads count are based on unit hackTime

	// profitability == 
	//   money/sec/GB ==
	//   profitAmount/profitTime/GB ==
	//   hackChance * (H*hackPercent*serverMaxMoney) / (H*1.7+G*1.75+2*1.75) / hackTime
	// where H is hack thread, G is grow thread
	const hackPercent = getOptimalHackPercent(ns, target)
	const growPercent = getOptimalGrowPercent(ns, target, attacker)
	const hackChance = getOptimalHackChance(ns, target)
	const hackTime = getOptimalHackTime(ns, target)
	const growTime = getOptimalGrowTime(ns, target)
	const weakenTime = getOptimalWeakenTime(ns, target)

	if (hackThread * securityRaiseByHack + growThread * securityRaiseByGrow - weakenThread * securityReduceByWeaken > 0) {
		ns.print(target + [hackThread, growThread, weakenThread] + " is not a valid combination. It can't weaken")
		return 0
	}

	if ((1 - hackThread * hackPercent) * growPercent ** growThread < 1) {
		ns.print(target + " [" + [hackThread, growThread, weakenThread] + "] is not a valid combination. It can't grow")
		return 0
	}
	const score = hackChance * (hackThread * hackPercent * ns.getServerMaxMoney(target)) /
		(hackThread * hackScriptRam + growThread * growScriptRam + weakenThread * weakenScriptRam) / hackTime

	// ns.print(target + " with config " + [hackThread, growThread, weakenThread] + " has score " + score)
	return score
}

export function getBestHGWHelper(ns, target, attacker, getGWFromHFunc, maxH = 1000) {
	let [bestH, bestG, bestW] = [0, 0, 0]
	let bestScore = 0
	for (let h = 1; h - bestH <= 10 && h <= maxH; h++) {
		const [g, w] = getGWFromHFunc(h)
		const score = getProfitPerRamSec(ns, target, h, g, w, attacker)
		if (score > bestScore) {
			[bestH, bestG, bestW] = [h, g, w]
			bestScore = score
		}
	}
	// ns.print('best HGW combination is ' + [bestH, bestG, bestW] + " with score: " + bestScore)
	return [bestH, bestG, bestW]
}

export function getBestBatchThreadConfig(ns, target, attacker, hackThread = null) {
	// profitability == argmax(H,G,W) profitPerRamSec(H,G,W)
	// constraints:
	// 1. (1-H*hackPercent) * (growPercent^G) >= 1 to ensure server money is always max
	// 2. W*weakenAmount >= H*hackAmount + G*growAmount

	// from 1, we have: 
	// growPercent^G >= 1/(1-H*hackPercent)
	// G >= ln(1/(1-H*hackPercent))/ln(growPercent)
	// since we want minimum G that satisfies the constraint so that profit is maximized
	// G = ceil(ln(1/(1-H*hackPercent))/ln(growPercent))
	function getG(h, leeWayMultiplier = 1.3) {
		if (1 - hackPercent * h <= 0) {
			return Infinity
		}
		return Math.ceil(leeWayMultiplier * Math.log2(1 / (1 - h * hackPercent)) / Math.log2(growPercent))
	}

	// from 2, we have: W >= (H*hackAmount + G*growAmount)/weakenAmount
	// intuitively we want to minimize W
	// so W = ceil((H*hackAmount + G*growAmount)/weakenAmount)
	const hackPercent = getOptimalHackPercent(ns, target)
	const growPercent = getOptimalGrowPercent(ns, target, attacker)

	function getGWFromH(h, leeWayMultiplier = 1.05) {
		const g = getG(h)
		return [g, Math.ceil(leeWayMultiplier * (h * securityRaiseByHack + g * securityRaiseByGrow) / securityReduceByWeaken)]
	}

	if (hackThread == null) {
		return getBestHGWHelper(ns, target, attacker, getGWFromH)
	} else {
		const [g, w] = getGWFromH(hackThread)
		return [hackThread, g, w]
	}
}

export function getBatchScriptRamAndNums(ns, target, h, g, w, freeRam) {
	const hackTime = getOptimalHackTime(ns, target)
	const growTime = getOptimalGrowTime(ns, target)
	const weakenTime = getOptimalWeakenTime(ns, target)

	function getApproxBatchScriptNum(hackScriptNum) {
		const growScriptNum = hackScriptNum * growTime / hackTime
		const weakScriptNum = hackScriptNum * weakenTime / hackTime
		return [hackScriptNum, growScriptNum, weakScriptNum]
	}
	function getBatchScriptNum(hackScriptNum) {
		const growScriptNum = hackScriptNum * growTime / hackTime
		const weakScriptNum = hackScriptNum * weakenTime / hackTime
		return [hackScriptNum, Math.ceil(growScriptNum), Math.ceil(weakScriptNum)]
	}
	function getBatchScriptRam(h, g, w, hs, gs, ws) {
		return hackScriptRam * h * hs + growScriptRam * g * gs + weakenScriptRam * w * ws
	}

	const approxUnitHGWScriptNum = getApproxBatchScriptNum(1)
	const approxUnitHGWRam = getBatchScriptRam(h, g, w, ...approxUnitHGWScriptNum)
	const approxHackScriptNum = Math.ceil(freeRam / approxUnitHGWRam)
	let hs = approxHackScriptNum
	let hgwScriptNum = getBatchScriptNum(hs)
	let ramNeed = getBatchScriptRam(h, g, w, ...hgwScriptNum)
	while (ramNeed > freeRam) {
		hs -= 1
		hgwScriptNum = getBatchScriptNum(hs)
		ramNeed = getBatchScriptRam(h, g, w, ...hgwScriptNum)
	}

	return [ramNeed, ...hgwScriptNum]
}


export function spawnBatchAttack(
	ns,
	target,
	attacker,
	reserveRam = null,
	maxScriptNum = 250,
	maxOpportunityCostRatioAllow = 0.8,
	growRedundancyPercent = 0.05,
	helperScript = '/exe/batch-helper.js',
) {
	reserveRam = reserveRam || (attacker == 'home' ? 50 : 0) // leave 50G for home
	if (reserveRam != 0) {
		ns.print("Reserve " + reserveRam + " for " + attacker)
	}
	let freeRam = ns.getServerMaxRam(attacker) - reserveRam - ns.getServerUsedRam(attacker)
	let [h, g, w] = getBestBatchThreadConfig(ns, target, attacker)
	const minimumAllowedProfit = getProfitPerRamSec(ns, target, h, g, w, attacker) * (1 - maxOpportunityCostRatioAllow)
	let [ramNeed, hs, gs, ws] = getBatchScriptRamAndNums(ns, target, h, g, w, freeRam)
	// fine-tune batch size to fit different server size.
	// continue condition:
	// 1: scriptNum > maxScriptNum
	// 2: ramNeed > maxRam
	// finish condition: 
	// 0: able to spawn 1-maxScriptNum number of scripts for server that fit-in RAM.
	// 1: RAM too big/small, h>1 but opportunity cost is greater than 30% -> fallback to use previous hgw config
	// 2: RAM too small, h=1 and can't spawn a single batch -> give up, return hgw=[0,0,0]
	while (!(hs > 0 && (hs + gs + ws) <= maxScriptNum)) {
		let ht = h; // i.e. hTest
		if (hs <= 0) {
			ns.print("batch too large for h=" + h + ", decreasing. " + [hs, gs, ws])
			ht--;
			if (ht == 0) {
				break;
			}
		} else {
			ns.print("batch too small for h=" + h + ", increasing h. " + [hs, gs, ws])
			ht++;
		}
		let [unused, gt, wt] = getBestBatchThreadConfig(ns, target, attacker, ht)
		if (getProfitPerRamSec(ns, target, ht, gt, wt, attacker) < minimumAllowedProfit) {
			break;
		}
		h = ht
		g = gt
		w = wt
		const result = getBatchScriptRamAndNums(ns, target, h, g, w, freeRam)
		ramNeed = result[0]
		hs = result[1]
		gs = result[2]
		ws = result[3]
	}

	while ((hs + gs + ws) > maxScriptNum) {
		freeRam = freeRam * 0.95
		const result = getBatchScriptRamAndNums(ns, target, h, g, w, freeRam)
		ramNeed = result[0]
		hs = result[1]
		gs = result[2]
		ws = result[3]
	}

	ns.print(attacker + " attack " + target + " by spawn HGW config " + [h, g, w] + ", total script num = " + (hs + gs + ws), ", respective script num = " + [hs, gs, ws])

	const pid = ns.exec(helperScript, ns.getHostname(), 1, target, attacker, h, g, w, hs, gs, ws, reserveRam)
	if (pid == 0) {
		ns.toast("Failed to execute spawn batch-helper", 'error', 10000)
	}
}

export function getRamConstraintThreadConfig(ns, target, attacker, hgw = getBestBatchThreadConfig(ns, target, attacker), leftRam = ns.getServerMaxRam(attacker) - ns.getServerUsedRam(attacker)) {
	var [h, g, w] = hgw
	const unsatisfiedRam = getBatchRam(ns, h, g, w) - leftRam
	if (unsatisfiedRam <= 0) {
		return hgw
	}

	const hTrimCount = 10
	const gTrimCount = 0
	const wTrimCount = 1
	const trimBatch = getBatchRam(ns, hTrimCount, gTrimCount, wTrimCount)

	const trimBatchCount = Math.floor(unsatisfiedRam / trimBatch)
	h -= Math.max(hTrimCount * trimBatchCount, 0)
	g -= Math.max(gTrimCount * trimBatchCount, 0)
	w -= Math.max(wTrimCount * trimBatchCount, 0)
	// if still need more ram, remove h
	const leftOver = getBatchRam(ns, h, g, w) - leftRam
	h -= Math.ceil(leftOver / hackScriptRam)
	// if still need more ram, remove g
	if (h < 0) {
		const stillLeftOver = leftOver - Math.ceil(leftOver / hackScriptRam) - h * hackScriptRam
		h = 0
		g -= Math.ceil(stillLeftOver / growScriptRam)
	}

	if (g < 0 || w <= 0) {
		ns.print("Calculated leftOver batch is invalid: " + [h, g, w])
		return [0, 0, 0]
	}
	return [h, g, w]
}

export function getProfitabilityScore(ns, hostname) {
	if(hostname == 'home' || hostname.includes('hacknet')){
		return 0;
	}
	if (ns.getServerRequiredHackingLevel(hostname) > ns.getHackingLevel() || ns.getServerMoneyAvailable(hostname) == 0 || ns.hackAnalyzeChance(hostname) == 0) {
		return 0;
	}

	if (!ns.fileExists("Formulas.exe", "home")) {
		// no formulas API, intuitive value
		return ns.getServerMaxMoney(hostname) * ns.getServerGrowth(hostname) / ns.getHackTime(hostname) * (ns.hackAnalyzeChance(hostname))
	}

	const [hackThread, growThread, weakenThread] = getBestBatchThreadConfig(ns, hostname, "home")
	return getProfitPerRamSec(ns, hostname, hackThread, growThread, weakenThread)
}

export function getBatchRam(ns, hackThread, growThread, weakenThread) {
	return hackScriptRam * hackThread + growScriptRam * growThread + weakenScriptRam * weakenThread
}

export async function main(ns) {
	const target = 'phantasy'
	const attacker = 'home'
	const server = ns.getServer(target)
	const player = ns.getPlayer()

	ns.disableLog('ALL')
	ns.print("target = " + target)
	ns.tail()

	// ns.print(getBestBatchThreadConfig(ns, target, attacker))
	spawnBatchAttack(ns, target, attacker,
		0,
		200,
		0.6,
		'/batch/spawn-batch.js',
	)
	// ns.print(getBestBatchThreadConfig(ns, target, attacker))
	// ns.print(await getBestLoopThreadConfig(ns, target, 'home', false))
	// ns.print(await getBestLoopThreadConfig(ns, target, 'home', true))
	// ns.print(await spawnSelfLoopingHGWScripts(ns, target, 'home'))
}