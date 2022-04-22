import { findAllServers } from '/lib/find-all-servers.js'
import { tryRoot } from '/lib/try-root.js'
import { findBestServerToHack } from '/lib/find-best-server-to-hack.js'
import { deployOnServer } from '/deploy.js'
import { getProfitabilityScore } from '/lib/analysis.js'
import { forceSpawn } from "/exe/force-spawn.js"


function now() {
	return new Date().getTime()
}
class TaskExecutor {
	constructor() {
		this.taskQueue = []
	}

	async beginLoopToExecuteTaskQueue(ns, taskClasses = []) {
		for (let TaskClass of taskClasses) {
			this.scheduleSleep(ns, new TaskClass(ns))
		}
		while (true) {
			while (this.taskQueue.length == 0) {
				ns.print("taskQueue is empty, waiting")
				await ns.sleep(500)
			}
			let closestTask = this.taskQueue.reduce((a, b) => a.timeLeft < b.timeLeft ? a : b, this.taskQueue[0])

			ns.print("Executing " + closestTask.task.constructor.name + " sleeping " + closestTask.timeLeft + "ms.")
			this.taskQueue = this.taskQueue.filter(t => t != closestTask)
			if (closestTask.timeLeft > 0) {
				this.markTimePassed(ns, closestTask.timeLeft)
				await ns.sleep(closestTask.timeLeft)
			}
			const startTime = now()
			await closestTask.task.runTask(ns)
			this.markTimePassed(ns, now() - startTime)

			this.scheduleSleep(ns, closestTask.task, this.taskQueue)
		}
	}

	scheduleSleep(ns, task) {
		this.taskQueue.push({ task: task, timeLeft: task.loopIntervalMs })
	}

	markTimePassed(ns, timePassedMs) {
		for (let schedule of this.taskQueue) {
			schedule.timeLeft -= timePassedMs
		}
	}

}


class LoopTask {
	constructor(loopIntervalMs) {
		this.loopIntervalMs = loopIntervalMs
	}
}

class DisplayServerStatusTask extends LoopTask {
	constructor() {
		super(10000)
	}
	runTask(ns) {
		let target = findBestServerToHack(ns)
		const maxMoney = ns.getServerMaxMoney(target)
		const currentMoney = ns.getServerMoneyAvailable(target)
		const moneyRatio = currentMoney / maxMoney * 100
		const securityDelta = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)
		const info = 'Server ' + target + ' status: money = ' + moneyRatio + "%, securityDelta = +" + securityDelta
		ns.toast(info, 'info', this.loopIntervalMs)
		ns.print(info)
	}
}


class HackNewServerTask extends LoopTask {
	constructor(ns) {
		super(5000)
		this.hackedServers = Array.from(findAllServers(ns)).filter(s => ns.hasRootAccess(s))
	}

	runTask(ns) {
		for (let server of findAllServers(ns)) {
			if (!this.hackedServers.includes(server) && ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel() && tryRoot(ns, server)) {
				this.hackedServers.push(server)
			}
		}
	}
}

class RefreshAttackTargetTask extends LoopTask {
	constructor(ns) {
		super(120000)
		this.killFilenames = ['/exe/forever-hack.script', '/exe/forever-grow.script', '/exe/forever-weaken.script', '/exe/exploit.js', '/exe/share.script']
		this.killSpawnerScriptName = "/exe/batch-helper.js"
		this.killSpawnerScriptAttackArgPos = 1
	}


	async runTask(ns) {
		const bestTarget = findBestServerToHack(ns)
		const allServers = findAllServers(ns)
		const maxProfitScore = getProfitabilityScore(ns, bestTarget)
		const killFilenames = this.killFilenames
		function getTargetOf(attacker) {
			for (const process of ns.ps(attacker)) {
				if (killFilenames.includes(process.filename)) {
					for (const arg of process.args) {
						if (allServers.has(arg)) {
							// ns.print("target of " + attacker + " is " + arg)
							return arg
						}
					}
				}
			}
			ns.print("Unable to find target for " + attacker)
			return null
		}

		// sort server according to RAM so each time this task is run we change server with minimum RAM first
		const subOptimalServers = Array.from(allServers).filter(attacker => {
			const attackerProcesses = ns.ps(attacker).filter(p => this.killFilenames.includes(p.filename))
			return ns.hasRootAccess(attacker) &&
				ns.getServerMaxRam(attacker) > 0 &&
				attackerProcesses.length > 0 &&
				!attackerProcesses.some(process => process.args.includes(bestTarget))
		})
		if (subOptimalServers.length == 0) {
			ns.print("All servers are targeting best target: " + bestTarget)
			return
		}

		const toRefresh = subOptimalServers.filter(attacker => {
			const prevTarget = getTargetOf(attacker)
			if (prevTarget == null) {
				return true // should refresh
			}
			const profitabilityScore = getProfitabilityScore(ns, prevTarget)
			if (profitabilityScore == 0) {
				// ns.toast("profitability score of " + prevTarget + " has profitability score of 0 ??? stop refreshing it to a new target.", "info", 60000)
				return false // don't refresh
			}
			return profitabilityScore < 0.1 * maxProfitScore
		})
		if (toRefresh.length > 0) {
			ns.toast("Refreshing hack target of [" + toRefresh + "] due to their low profile target", 'info', this.loopIntervalMs)
		}
		const minRamServer = subOptimalServers.reduce((a, b) =>
			ns.getServerMaxRam(a) < ns.getServerMaxRam(b) ? a : b, subOptimalServers[0]
		)
		if (!toRefresh.includes(minRamServer)) {
			toRefresh.push(minRamServer)
			ns.toast("Refreshing hack target of " + minRamServer + " due to targeting sub-optimal server " + getTargetOf(minRamServer) + " instead of " + bestTarget, "info", this.loopIntervalMs)
		}

		for (const server of toRefresh) {
			// kill spawner process for the server on localhost
			for (const process of ns.ps()) {
				if (process.filename == this.killSpawnerScriptName && process.args[this.killSpawnerScriptAttackArgPos] == server) {
					ns.toast("Killed spawner process for " + server + " at localhost whose args were [" + process.args + "]", 'info', 5000)
					ns.kill(process.pid)
				}
			}
			// kill processes on the server
			ns.ps(server).filter(process => this.killFilenames.includes(process.filename)).forEach(process => ns.kill(process.pid))
		}
	}
}

class DeployEmptyServersTask extends LoopTask {
	constructor(ns) {
		super(5001)
		this.treatAsEmpty = [ns.getScriptName(), '/exe/batch-helper.js']
		this.minRamSpaceToDeploy = 4
		this.spawnerScriptName = '/exe/batch-helper.js'
		this.spawnerScriptAttackArgPos = 1
	}

	shouldDeploy(ns, attacker) {
		const processes = ns.ps(attacker)

		const beingDeployed = processes.some(p => (p.filename == this.spawnerScriptName && p.args[this.spawnerScriptAttackArgPos] == attacker))
		const ignoreRamUsed = processes.filter(p => this.treatAsEmpty.includes(p.filename)).map(p => ns.getScriptRam(p.filename)).reduce((a, b) => a + b, 0)

		return (ns.getServerMaxRam(attacker) >= this.minRamSpaceToDeploy) && (ns.getServerUsedRam(attacker) == ignoreRamUsed) && ns.hasRootAccess(attacker) && !beingDeployed && !attacker.includes('hacknet')
	}

	async runTask(ns) {
		for (let attacker of findAllServers(ns)) {
			if (this.shouldDeploy(ns, attacker)) {
				// ns.toast("Deploy scripts on: '" + attacker + "'", 'success', 10000)
				ns.print("Deploy scripts on: '" + attacker + "'")
				await deployOnServer(ns, findBestServerToHack(ns), attacker)
				await ns.sleep(2000)
			}
		}
	}
}

class TrySolveCodingContractTask extends LoopTask {
	constructor(ns) {
		super(5 * 60 * 1000)
	}

	async runTask(ns) {
		ns.exec('exe/coding-contract.js', ns.getHostname(), 1)
	}
}

class BuyNewServerTask extends LoopTask {
	constructor(ns, startRam = 4, stopRam = 2 ** 20, reservedMoneyMultiplier = 4, serverScaleFactor = 4) {
		super(10000)
		this.startRam = startRam
		this.stopRam = stopRam
		this.reservedMoneyMultiplier = reservedMoneyMultiplier
		this.serverScaleFactor = serverScaleFactor
	}

	async runTask(ns) {
		await forceSpawn(ns, '/exe/try-buy-server.js', [], this.startRam, this.stopRam, this.reservedMoneyMultiplier, this.serverScaleFactor)
	}
}

class BuyAugsTask extends LoopTask {
	constructor(ns) {
		super(10000)
		this.minAugNumToInstall = 3
	}

	async runTask(ns) {
		await forceSpawn(ns, 'singular.js', [], this.minAugNumToInstall)
	}
}

class SleeveTask extends LoopTask {
	constructor(ns) {
		super(20000)
		this.script = 'sleeve.js'
		this.deps = ['/exe/find-path.js', '/lib/connect.js', '/lib/faction.js']
	}

	async runTask(ns) {
		await forceSpawn(ns, this.script, this.deps)
	}
}

class GangTask extends LoopTask {
	constructor(ns) {
		super(20000)
		this.script = 'gang.js'
	}

	async runTask(ns) {
		await forceSpawn(ns, this.script)
	}
}

class TinySingularTask extends LoopTask {
	constructor(ns) {
		super(30000)
		this.scripts = [
			'/exe/purchase-tor.js',
			'/exe/buy-programs.js',
			'/exe/upgrade-home.js',
			'/exe/join-factions.js',
			'/exe/backdoor.js',
		]
	}

	async runTask(ns) {
		for (const script of this.scripts) {
			await forceSpawn(ns, script)
			await ns.sleep(200)
		}
	}
}

class AdjustWork extends LoopTask {
	constructor(ns) {
		super(10000)
		this.alwaysDontFocus = true
	}

	async runTask(ns) {
		const player = ns.getPlayer()
		if (await forceSpawn(ns, 'work.js', [], this.alwaysDontFocus)) {
			return
		} else if (player.city == 'Sector-12' && player.hacking < 75) {
			await forceSpawn(ns, '/exe/study-cs.js')
		} else {
			ns.toast("Unable to spawn work..", 'error')
		}
	}
}

class StockTask extends LoopTask {
	constructor(ns) {
		super(10000)
		this.stockToMoneyRatio = 2
	}

	async runTask(ns) {
		await forceSpawn(ns, '/exe/tix.js', [], this.stockToMoneyRatio)
	}
}

class CorpTask extends LoopTask {
	constructor(ns) {
		super(30000)
	}

	async runTask(ns) {
		await forceSpawn(ns, 'corp.js')
	}
}

class HacknetTask extends LoopTask {
	constructor(ns) {
		super(8000)
	}

	async runTask(ns) {
		await forceSpawn(ns, 'hacknet.js', [])
	}
}

/** @param {NS} ns **/
export async function main(ns) {

	ns.disableLog('ALL')
	ns.tail()


	const tasks = [
		// DisplayServerStatusTask,
		HackNewServerTask,
		RefreshAttackTargetTask,
		DeployEmptyServersTask,
		TrySolveCodingContractTask,
		BuyAugsTask,
		SleeveTask,
		TinySingularTask,
		AdjustWork,
		StockTask,
		CorpTask,
		GangTask,
		HacknetTask,
	]
	if (ns.getPurchasedServerLimit() > 0) {
		tasks.push(BuyNewServerTask)
	} else {
		ns.toast("Purchase Server Count Limit = 0, never buy new server")
	}

	await new TaskExecutor().beginLoopToExecuteTaskQueue(ns, tasks)
}