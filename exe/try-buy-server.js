/** @param {NS} ns **/

class BuyNewServerTask {
	constructor(ns, startRam = 4, stopRam = 2 ** 20, reservedMoneyMultiplier = 2, serverScaleFactor = 4) {
		this.ram = startRam
		this.stopRam = stopRam
		this.reservedMoneyMultiplier = reservedMoneyMultiplier; // threshold to trigger buy when money can buy X number of server.
		this.serverScaleFactor = serverScaleFactor; // when server num reaches limit, how many folds should we expand server.
		while (ns.getPurchasedServerCost(this.stopRam) == Infinity) {
			this.stopRam = this.stopRam / 2
		}
	}

	static reachServerNumLimit(ns) {
		return ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()
	}

	static findWorstServer(ns) {
		let worst = null;
		let worstRam = null;
		for (const server of ns.getPurchasedServers()) {
			if (worstRam == null || ns.getServerMaxRam(server) < worstRam) {
				worst = server;
				worstRam = ns.getServerMaxRam(server);
			}
		}
		return worst;
	}

	tryBuyServer(ns, ram) {
		if ((ns.getServerMoneyAvailable("home") < ns.getPurchasedServerCost(ram) * this.reservedMoneyMultiplier)) {
			ns.print("not enough money to buy server with " + ram + "GB Ram. cost = " + ns.getPurchasedServerCost(ram))
			return null;
		}
		if (BuyNewServerTask.reachServerNumLimit(ns)) {
			// delete worst server.
			const worst = BuyNewServerTask.findWorstServer(ns)
			if (ram < ns.getServerMaxRam(worst)) {
				ns.print("Trying to buy a server with worse RAM config than current worst server's RAM.")
				return null;
			}
			ns.killall(worst);
			ns.deleteServer(worst);
		}
		let serverName = null;
		for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
			const testName = "server-" + i + "-" + ram + "g";
			if (!ns.serverExists(testName)) {
				serverName = testName;
				break;
			}
		}
		return ns.purchaseServer(serverName, ram);
	}


	runTask(ns) {
		const autoBumpUpRamThreshold = Math.max(5, this.reservedMoneyMultiplier * 5)
		while (ns.getServerMoneyAvailable('home') >= autoBumpUpRamThreshold * ns.getPurchasedServerCost(this.ram) && this.ram < this.stopRam) {
			this.ram = Math.min(this.stopRam, this.ram * 2)
		}
		if (BuyNewServerTask.reachServerNumLimit(ns)) {
			const worstRam = ns.getServerMaxRam(BuyNewServerTask.findWorstServer(ns));
			if (worstRam >= this.stopRam) {
				ns.print("Worst RAM >= stop RAM " + this.stopRam + "GB. Stop buying any server.")
				return;
			}
			this.ram = Math.min(Math.max(worstRam * this.serverScaleFactor, this.ram), this.stopRam);
		}
		const serverName = this.tryBuyServer(ns, this.ram);

		if (serverName) {
			ns.toast("Purchased a new server '" + serverName + "' with " + this.ram + "GB of RAM", 'success', 10000);
		}
	}
}

export async function main(ns) {
	new BuyNewServerTask(ns, ...ns.args).runTask(ns)
}