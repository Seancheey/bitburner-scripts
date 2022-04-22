class BuyNewServerTask extends LoopTask {
    constructor(ns, startRam=16, stopRam=2**20, reservedMoneyMultiplier = 2, serverScaleFactor = 4){
        super(10000)
        this.ram = startRam
        this.stopRam = stopRam
        this.reservedMoneyMultiplier = reservedMoneyMultiplier; // threshold to trigger buy when money can buy X number of server.
        this.serverScaleFactor = serverScaleFactor; // when server num reaches limit, how many folds should we expand server.
    }

    static reachServerNumLimit() {
        return ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()
    }

    static findWorstServer() {
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

    static tryBuyServer(ram) {
        if ((ns.getServerMoneyAvailable("home") < ns.getPurchasedServerCost(ram) * reservedMoneyMultiplier)) {
            return null;
        }
        if (reachServerNumLimit()) {
            const worst = findWorstServer()
            const worstRam = ns.getServerMaxRam(worst);
            if (ram < worstRam) {
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


    run(ns) {
        if (this.reachServerNumLimit()) {
            const worstRam = ns.getServerMaxRam(this.findWorstServer());
            if (worstRam >= this.stopRam) {
                break;
            }
            this.ram = Math.min(Math.max(worstRam * this.serverScaleFactor, this.ram), this.stopRam);
            while (ns.getServerMoneyAvailable('home') >= ns.getPurchasedServerCost(this.ram) * 25 && this.ram < this.stopRam) {
                this.ram = Math.min(this.stopRam, this.ram * 2)
            }
        }

        const serverName = this.tryBuyServer(ram);

        if (serverName) {
            ns.toast("Purchased a new server '" + serverName + "' with " + this.ram + "GB of RAM", 'success', 10000);
        }
    }
}

export async function main(ns) {
    const testing = ns.args[0] == null;
    var ram = ns.args[0] || 16; // starting ram.
    const stopRam = ns.args[1] || 2 ** 20;
    const reservedMoneyMultiplier = ns.args[2] || 2; // threshold to trigger buy when money can buy X number of server.
    const serverScaleFactor = ns.args[3] || 4; // when server num reaches limit, how many folds should we expand server.


    if (testing) {
        ns.toast("testing script... Pass starting RAM as 1st argument to script to run real script")
    }
}