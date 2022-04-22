/** @param {NS} ns **/

export function toMoneyString(money) {
	const symbols = ["", "K", "M", "B", "T"]
	for (let i = 0; i < symbols.length; i++) {
		const exp = 10 ** ((i) * 3)
		const cap = 10 ** ((i + 1) * 3)
		if (Math.abs(money) < cap) {
			return Math.round(money / exp * 100) / 100 + symbols[i]
		}
	}
	return money / 1e18 + "q"
}

function canOperateTix(ns) {
	if (ns.getServerMoneyAvailable('home') < 1e9 ||
		!ns.stock.purchaseWseAccount() ||
		!ns.stock.purchaseTixApi() ||
		!ns.stock.purchase4SMarketData() ||
		!ns.stock.purchase4SMarketDataTixApi()) {
		ns.print("Not enough money or no API access to TIX. Aborting operation.")
		return false
	}
	return true
}

export function operate(ns, maxStockMoneyToCashRatio = 0.5) {
	if (!canOperateTix(ns)) {
		return false
	}

	trySellStocks(ns, maxStockMoneyToCashRatio)
	tryBuyStocks(ns, maxStockMoneyToCashRatio)
}

export function moneyDeltaToBestRatio(ns, maxStockMoneyToCashRatio) {
	// assume delta = money to invest, cs = current stock money, cm = current cash
	// (cs + delta) / (cm - delta) < N
	// cs + d < N * (cm - d)
	// cs + d < N*cm - N*d
	// N*d + d < N*cm - cs
	// d < (N*cm - cs) / (N+1)
	return (ns.getServerMoneyAvailable('home') * maxStockMoneyToCashRatio - getTotalMoneyInStock(ns)) / (1 + maxStockMoneyToCashRatio)
}

export function tryBuyStocks(ns, maxStockMoneyToCashRatio) {
	if (!canOperateTix(ns)) {
		return false
	}
	// try buy stocks
	const stockRatio = getTotalMoneyInStock(ns) / ns.getServerMoneyAvailable('home')
	if (stockRatio > maxStockMoneyToCashRatio) {
		ns.print("Current stock/cash ratio = " + stockRatio + " > " + maxStockMoneyToCashRatio + ", therefore skipping buying new stocks.")
		return false
	}
	const bestStocks = getBestStocksToBuy(ns)
	if (bestStocks.length == 0) {
		return false
	}
	const maxAllowableFund = moneyDeltaToBestRatio(ns, maxStockMoneyToCashRatio)
	const toBuy = bestStocks[0]
	const shareNum = Math.min(Math.floor(maxAllowableFund / ns.stock.getPrice(toBuy.sym)), ns.stock.getMaxShares(toBuy.sym) - ns.stock.getPosition(toBuy.sym)[0])
	if (shareNum <= 0) {
		ns.print("ShareNum " + shareNum + " < 0, skipping buying")
		return false
	}
	if (maxAllowableFund / 200 < 100e3) {
		ns.print("Commission fee is higher than 0.5%, skipping buying")
		return false
	}
	ns.stock.buy(toBuy.sym, shareNum)
	ns.tprint("Bought " + shareNum + " shares of '" + toBuy.sym + "'")
	return true
}

export function trySellStocks(ns, maxStockMoneyToCashRatio) {
	if (!canOperateTix(ns)) {
		return false
	}

	const sellStocks = getBestStocksToSell(ns)
	if (sellStocks.length == 0) {
		return false
	}
	const stockRatio = getTotalMoneyInStock(ns) / ns.getServerMoneyAvailable('home')
	const idealSellMoney = -moneyDeltaToBestRatio(ns, maxStockMoneyToCashRatio)
	const toSell = sellStocks[0]
	if (idealSellMoney < 0 && toSell.forcast > 0.5) {
		ns.print("Current stock/cash ratio = " + stockRatio + " < " + maxStockMoneyToCashRatio + ", therefore skipping selling new stocks.")
		return false
	}
	const sym = toSell.sym
	const pos = ns.stock.getPosition(sym)
	const price = ns.stock.getPrice(sym)
	const profitPerShare = price - pos[1]
	const sellShareNum = toSell.forcast < 0.5 ? pos[0] : Math.min(Math.ceil(idealSellMoney / price), pos[0])
	if (sellShareNum * price / 200 < 100e3) {
		ns.print("Commission fee is higher than 0.5%, skipping selling")
		return false
	}
	ns.stock.sell(toSell.sym, sellShareNum)
	ns.tprint("Sold '" + sym + "' with a profit of $" + profitPerShare + "/share, total profit of $" + toMoneyString(profitPerShare * sellShareNum))
	return true
}

export function getTotalMoneyInStock(ns) {
	if (!canOperateTix(ns)) {
		return 0
	}
	return ns.stock.getSymbols().map(s => {
		const pos = ns.stock.getPosition(s)
		return pos[0] * pos[1]
	}).reduce((a, b) => a + b, 0)
}

export function getBestStocksToSell(ns) {
	return ns.stock.getSymbols().
		filter(s => ns.stock.getPosition(s)[0] > 0).
		map(s => { return { sym: s, forcast: ns.stock.getForecast(s), volatility: ns.stock.getVolatility(s) } })
		.sort((a, b) => {
			return (a.forcast != b.forcast) ?
				a.forcast - b.forcast :
				b.volatility - a.volatility
		})
}

export function getBestStocksToBuy(ns) {
	return ns.stock.getSymbols().
		filter(s => ns.stock.getPosition(s)[0] != ns.stock.getMaxShares(s) && ns.stock.getForecast(s) > 0.57).
		map(s => { return { sym: s, forcast: ns.stock.getForecast(s), volatility: ns.stock.getVolatility(s) } })
		.sort((a, b) => {
			return (a.forcast != b.forcast) ?
				b.forcast - a.forcast :
				b.volatility - a.volatility
		})
}

export async function main(ns) {
	operate(ns, ...ns.args)
}