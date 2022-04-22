import { findAllServers } from "lib/find-all-servers.js"


export function findAllContracts(ns) {
	const contract = []
	const servers = findAllServers(ns)
	for (let server of servers) {
		for (let file of ns.ls(server)) {
			if (file.endsWith('.cct')) {
				contract.push({ server: server, file: file })
			}
		}
	}
	return contract
}

export function sanitizeParenthesesInExpression(ns, s) {
	function isValid(s) {
		let leftBracketToClose = 0
		for (const c of s) {
			if (c == '(') {
				leftBracketToClose++;
			} else if (c == ')') {
				leftBracketToClose--;
				if (leftBracketToClose < 0) {
					return false;
				}
			}
		}
		return leftBracketToClose == 0;
	}
	const queue = [s], seen = new Set(), result = [];
	seen.add(s);

	let validFound = false;

	while (queue.length > 0) {
		let expression = queue.shift();

		// If expression is valid
		if (isValid(expression)) {
			result.push(expression);// Push to result
			validFound = true;
		}

		if (validFound) continue;// If atleast one valid string found, don't do anything

		for (let i = 0; i < expression.length; i++) {
			if (expression[i] !== '(' && expression[i] !== ')') {
				continue;// If expression's i-th character is anything but one of ( or ), continue
			}

			// Calculate next string for consideration
			// Characters 0 to i-th (not including) + Characters (i + 1)th (including) to end
			let next = expression.substring(0, i) + expression.substring(i + 1);
			if (!seen.has(next)) {
				seen.add(next);
				queue.push(next);
			}
		}
	}
	if (result.length === 0) {
		return '[""]'
	}
	return "[" + result.join(" ,") + "]";
}

export function minimumPathSumInATriangle(ns, triangle) {
	const pathCost = triangle.map(row => row.map(_ => 0xFFFFFFF))
	const searchQueue = [{ x: 0, y: 0, cost: triangle[0][0] }]
	pathCost[0][0] = triangle[0][0]
	while (searchQueue.length > 0) {
		const toSearch = searchQueue.shift()
		const x = toSearch.x, y = toSearch.y
		const neighbors = [{ x: x, y: y + 1 }, { x: x + 1, y: y + 1 }]
		neighbors.filter((coord) => {
			if (!pathCost[coord.y]) {
				return false;
			}
			if (!pathCost[coord.y][coord.x]) {
				return false;
			}
			return pathCost[coord.y][coord.x] > pathCost[y][x] + triangle[coord.y][coord.x]
		}
		).forEach((coord) => {
			pathCost[coord.y][coord.x] = pathCost[y][x] + triangle[coord.y][coord.x]
			searchQueue.push(coord)
		})
		searchQueue.sort((a, b) => { a.cost - b.cost })
	}
	return pathCost[pathCost.length - 1].reduce((a, b) => a < b ? a : b, 0xFFFFFF)
}

export function subarrayWithMaximumSum(ns, array) {
	let maxSum = -0xFFFFF
	let rangeSum = 0
	for (const i in array) {
		const num = array[i]
		rangeSum += num
		if (num > rangeSum) {
			rangeSum = num
		}
		if (rangeSum > maxSum) {
			maxSum = rangeSum
		}
	}
	return maxSum
}

export function spiralizeMatrix(ns, arr) {
	if (arr.length == 1) {
		return "[" + arr[0].join(" ,") + "]"
	}

	let i, k = 0, l = 0;
	let m = arr.length;
	let n = arr[0].length;
	const out = [];
	while (k < m && l < n) {
		for (i = l; i < n; ++i) {
			out.push(arr[k][i]);
		}
		k++;
		for (i = k; i < m; ++i) {
			out.push(arr[i][n - 1]);
		}
		n--;
		if (k < m) {
			for (i = n - 1; i >= l; --i) {
				out.push(arr[m - 1][i]);
			}
			m--;
		}
		if (l < n) {
			for (i = m - 1; i >= k; --i) {
				out.push(arr[i][l]);
			}
			l++;
		}
	}
	return "[" + out.join(" ,") + "]"
}

export function generateIpAddresses(ns, ip) {
	function is_valid(ip) {
		let ips = new Array();
		let ex = "";
		for (let i = 0; i < ip.length; i++) {
			if (ip[i] == '.') {
				ips.push(ex);
				ex = "";
			}
			else {
				ex = ex + ip[i];
			}
		}
		ips.push(ex);

		for (let i = 0; i < ips.length; i++) {

			if (ips[i].length > 3
				|| parseInt(ips[i]) < 0
				|| parseInt(ips[i]) > 255)
				return 0;

			if (ips[i].length > 1
				&& parseInt(ips[i]) == 0)
				return 0;

			if (ips[i].length > 1
				&& parseInt(ips[i]) != 0
				&& ips[i][0] == '0')
				return 0;
		}
		return 1;
	}

	let l = ip.length;

	if (l > 12 || l < 4) {
		return "[]";
	}

	let check = ip;
	let ans = new Array();

	for (let i = 1; i < l - 2; i++) {
		for (let j = i + 1; j < l - 1; j++) {
			for (let k = j + 1; k < l; k++) {
				check = check.substring(0, k) + "."
					+ check.substring(k, check.length);
				check
					= check.substring(0, j) + "."
					+ check.substring(j, check.length);
				check
					= check.substring(0, i) + "."
					+ check.substring(i, check.length);

				if (is_valid(check)) {
					ans.push(check);
				}
				check = ip;
			}
		}
	}
	return "[" + ans.join(", ") + "]"
}

export function uniquePathsInAGridI(ns, rowCol) {
	const [m, n] = rowCol
	function factorial(x) {
		return x == 1 ? 1 : x * factorial(x - 1)
	}
	return (factorial(m + n - 2) / (factorial(m - 1) * factorial(n - 1)))
}

function maxProfit(arrayData) {
	let i, j, k;

	let maxTrades = arrayData[0];
	let stockPrices = arrayData[1];

	// WHY?
	let tempStr = "[0";
	for (i = 0; i < stockPrices.length; i++) {
		tempStr += ",0";
	}
	tempStr += "]";
	let tempArr = "[" + tempStr;
	for (i = 0; i < maxTrades - 1; i++) {
		tempArr += "," + tempStr;
	}
	tempArr += "]";

	let highestProfit = JSON.parse(tempArr);

	for (i = 0; i < maxTrades; i++) {
		for (j = 0; j < stockPrices.length; j++) { // Buy / Start
			for (k = j; k < stockPrices.length; k++) { // Sell / End
				if (i > 0 && j > 0 && k > 0) {
					highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], highestProfit[i - 1][j - 1] + stockPrices[k] - stockPrices[j]);
				} else if (i > 0 && j > 0) {
					highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i - 1][j - 1] + stockPrices[k] - stockPrices[j]);
				} else if (i > 0 && k > 0) {
					highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], stockPrices[k] - stockPrices[j]);
				} else if (j > 0 && k > 0) {
					highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i][k - 1], stockPrices[k] - stockPrices[j]);
				} else {
					highestProfit[i][k] = Math.max(highestProfit[i][k], stockPrices[k] - stockPrices[j]);
				}
			}
		}
	}
	return highestProfit[maxTrades - 1][stockPrices.length - 1];
}

export function algoTrade1(ns, data) {
	return maxProfit([1, data])
}

export function algoTrade2(ns, data) {
	return maxProfit([Math.ceil(data.length / 2), data]);
}

export function algoTrade3(ns, data) {
	return maxProfit([2, data]);
}

export function algoTrade4(ns, data) {
	return maxProfit(data);
}

export function findAllValidMathExpressions(ns, data) {
	const digits = data[0].split('')
	const operators = ['+', '-', '*', '']
	let expressions = [digits[0], '-' + digits[0]]
		.flatMap(d => operators.map(op => d + op))
	for (let i = 1; i < digits.length - 1; i++) {
		expressions = expressions
			.flatMap(e => operators.map(op => e + digits[i] + op))
	}
	return expressions.map(e => e + digits[digits.length - 1])
		.filter(e => {
			try { return eval(e) === data[1] }
			catch (e) { return false }
		})
}

export function findLargestPrimeFactor(ns, num) {
	for (let div = 2; div <= Math.sqrt(num); div++) {
		if (num % div != 0) {
			continue;
		}
		num = num / div;
		div = 1;
	}
	return num;
}

export function uniquePathsInAGridII(ns, nums) {
	const memo = [...new Array(nums.length + 1)].map(a => [...new Array(nums[0].length + 1)].fill(-Infinity));
	let [m, n] = [nums.length, nums[0].length]
	const dp = (i, j) => {
		if (i >= m || j >= n || nums[i][j] === 1) return 0;
		if (i === m - 1 && j === n - 1) return 1;
		if (memo[i][j] !== -Infinity) return memo[i][j];
		return memo[i][j] = dp(i + 1, j) + dp(i, j + 1)
	}
	return dp(0, 0)
}

export function arrayJump(ns, data) {
	function findJump(data, pos) {
		var maxJump = data[pos]
		if (pos + maxJump >= data.length - 1) {
			return 1;
		}
		for (var i = 1; i <= maxJump; i++) {
			if (findJump(data, pos + i) == 1) {
				return 1;
			}
		}
		return 0;
	}

	return findJump(data, 0);
}

export function arrayJump2(ns, data) {
	const n = data.length;
	let reach = 0;
	let jumps = 0;
	let lastJump = -1;
	while (reach < n - 1) {
		let jumpedFrom = -1;
		for (let i = reach; i > lastJump; i--) {
			if (i + data[i] > reach) {
				reach = i + data[i];
				jumpedFrom = i;
			}
		}
		if (jumpedFrom === -1) {
			jumps = 0;
			break;
		}
		lastJump = jumpedFrom;
		jumps++;
	}
	return jumps;
}

export function hammingDecode(ns, _data) {
	//check for altered bit and decode
	const _build = _data.split(""); // ye, an array for working, again
	const _testArray = []; //for the "truthtable". if any is false, the data has an altered bit, will check for and fix it
	const _sumParity = Math.ceil(Math.log2(_data.length)); // sum of parity for later use
	const count = (arr, val) =>
		arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
	// the count.... again ;)

	let _overallParity = _build.splice(0, 1).join(""); // store first index, for checking in next step and fix the _build properly later on
	_testArray.push(_overallParity == (count(_build, "1") % 2).toString() ? true : false); // first check with the overall parity bit
	for (let i = 0; i < _sumParity; i++) {
		// for the rest of the remaining parity bits we also "check"
		const _tempIndex = Math.pow(2, i) - 1; // get the parityBits Index
		const _tempStep = _tempIndex + 1; // set the stepsize
		const _tempData = [..._build]; // get a "copy" of the build-data for working
		const _tempArray = []; // init empty array for "testing"
		while (_tempData[_tempIndex] != undefined) {
			// extract from the copied data until the "starting" index is undefined
			const _temp = [..._tempData.splice(_tempIndex, _tempStep * 2)]; // extract 2*stepsize
			_tempArray.push(..._temp.splice(0, _tempStep)); // and cut again for keeping first half
		}
		const _tempParity = _tempArray.shift(); // and again save the first index separated for checking with the rest of the data
		_testArray.push(_tempParity == (count(_tempArray, "1") % 2).toString() ? true : false);
		// is the _tempParity the calculated data? push answer into the 'truthtable'
	}
	let _fixIndex = 0; // init the "fixing" index and start with 0
	for (let i = 1; i < _sumParity + 1; i++) {
		// simple binary adding for every boolean in the _testArray, starting from 2nd index of it
		_fixIndex += _testArray[i] ? 0 : Math.pow(2, i) / 2;
	}
	_build.unshift(_overallParity); // now we need the "overall" parity back in it's place
	// try fix the actual encoded binary string if there is an error
	if (_fixIndex > 0 && _testArray[0] == false) {
		// if the overall is false and the sum of calculated values is greater equal 0, fix the corresponding hamming-bit
		_build[_fixIndex] = _build[_fixIndex] == "0" ? "1" : "0";
	} else if (_testArray[0] == false) {
		// otherwise, if the the overall_parity is the only wrong, fix that one
		_overallParity = _overallParity == "0" ? "1" : "0";
	} else if (_testArray[0] == true && _testArray.some((truth) => truth == false)) {
		return 0; // uhm, there's some strange going on... 2 bits are altered? How? This should not happen 👀
	}
	// oof.. halfway through... we fixed an possible altered bit, now "extract" the parity-bits from the _build
	for (let i = _sumParity; i >= 0; i--) {
		// start from the last parity down the 2nd index one
		_build.splice(Math.pow(2, i), 1);
	}
	_build.splice(0, 1); // remove the overall parity bit and we have our binary value
	return parseInt(_build.join(""), 2); // parse the integer with redux 2 and we're done!
}

export function hammingEncode(ns, value) {
	// encoding following Hammings rule
	function hammingSumOfParity(_lengthOfDBits) {
		// will calculate the needed amount of parityBits 'without' the "overall"-Parity (that math took me 4 Days to get it working)
		return _lengthOfDBits < 3 || _lengthOfDBits == 0 // oh and of course using ternary operators, it's a pretty neat function
			? _lengthOfDBits == 0
				? 0
				: _lengthOfDBits + 1
			: // the following math will only work, if the length is greater equal 3, otherwise it's "kind of" broken :D
			Math.ceil(Math.log2(_lengthOfDBits * 2)) <=
				Math.ceil(Math.log2(1 + _lengthOfDBits + Math.ceil(Math.log2(_lengthOfDBits))))
				? Math.ceil(Math.log2(_lengthOfDBits) + 1)
				: Math.ceil(Math.log2(_lengthOfDBits));
	}
	const _data = value.toString(2).split(""); // first, change into binary string, then create array with 1 bit per index
	const _sumParity = hammingSumOfParity(_data.length); // get the sum of needed parity bits (for later use in encoding)
	const count = (arr, val) =>
		arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
	// function count for specific entries in the array, for later use

	const _build = ["x", "x", ..._data.splice(0, 1)]; // init the "pre-build"
	for (let i = 2; i < _sumParity; i++) {
		// add new paritybits and the corresponding data bits (pre-building array)
		_build.push("x", ..._data.splice(0, Math.pow(2, i) - 1));
	}
	// now the "calculation"... get the paritybits ('x') working
	for (const index of _build.reduce(function (a, e, i) {
		if (e == "x") a.push(i);
		return a;
	}, [])) {
		// that reduce will result in an array of index numbers where the "x" is placed
		const _tempcount = index + 1; // set the "stepsize" for the parityBit
		const _temparray = []; // temporary array to store the extracted bits
		const _tempdata = [..._build]; // only work with a copy of the _build
		while (_tempdata[index] !== undefined) {
			// as long as there are bits on the starting index, do "cut"
			const _temp = _tempdata.splice(index, _tempcount * 2); // cut stepsize*2 bits, then...
			_temparray.push(..._temp.splice(0, _tempcount)); // ... cut the result again and keep the first half
		}
		_temparray.splice(0, 1); // remove first bit, which is the parity one
		_build[index] = (count(_temparray, "1") % 2).toString(); // count with remainder of 2 and"toString" to store the parityBit
	} // parity done, now the "overall"-parity is set
	_build.unshift((count(_build, "1") % 2).toString()); // has to be done as last element
	return _build.join(""); // return the _build as string
}

export function waysToSum(ns, data) {
	const ways = [1];
	ways.length = data + 1;
	ways.fill(0, 1);
	for (let i = 1; i < data; ++i) {
		for (let j = i; j <= data; ++j) {
			ways[j] += ways[j - i];
		}
	}

	return ways[data]
}

export function waysToSum2(ns, data) {
	const n = data[0];
	const s = data[1];
	const ways = [1];
	ways.length = n + 1;
	ways.fill(0, 1);
	for (let i = 0; i < s.length; i++) {
		for (let j = s[i]; j <= n; j++) {
			ways[j] += ways[j - s[i]];
		}
	}
	return ways[n];
}

export function shortestPath(ns, data) {
	const xbound = data[0].length
	const ybound = data.length

	function convertToPath(node) {
		const path = []
		let cur = node
		while (cur != null) {
			path.unshift(cur)
			cur = cur.last
		}
		const str = []
		for (let i = 0; i < path.length - 1; i++) {
			const xdiff = path[i + 1].x - path[i].x
			const ydiff = path[i + 1].y - path[i].y
			if (xdiff == -1) {
				str.push('L')
			} else if (xdiff == 1) {
				str.push('R')
			} else if (ydiff == -1) {
				str.push('U')
			} else {
				str.push('D')
			}
		}
		return str.join('')
	}

	const actions = [
		{ x: -1, y: 0, check: (x, y) => x >= 0 },
		{ x: 1, y: 0, check: (x, y) => x < xbound },
		{ x: 0, y: -1, check: (x, y) => y >= 0 },
		{ x: 0, y: 1, check: (x, y) => y < ybound },
	]
	const visited = new Set()
	visited.add(0)
	const toVisit = [{ x: 0, y: 0, last: null }]
	const goal = { x: xbound - 1, y: ybound - 1 }
	// ns.print("xbound = " + xbound + ", ybound = " + ybound)
	while (toVisit.length > 0) {
		const test = toVisit.shift()
		if (test.x === goal.x && test.y === goal.y) {
			return convertToPath(test)
		}
		// ns.print('testing ' + test.x + ", " + test.y)
		for (const action of actions) {
			const nx = action.x + test.x
			const ny = action.y + test.y
			const pos = { x: nx, y: ny }
			const posInt = nx + ny * 10000
			if (action.check(nx, ny) && !visited.has(posInt) && data[ny][nx] != 1) {
				visited.add(posInt)
				toVisit.push({ x: pos.x, y: pos.y, last: test })
			}
		}
	}
	// ns.print("Unreachable")
	return ''
}

const problemSolverMap = {
	"Sanitize Parentheses in Expression": sanitizeParenthesesInExpression,
	"Minimum Path Sum in a Triangle": minimumPathSumInATriangle,
	"Subarray with Maximum Sum": subarrayWithMaximumSum,
	"Spiralize Matrix": spiralizeMatrix,
	"Generate IP Addresses": generateIpAddresses,
	"Unique Paths in a Grid I": uniquePathsInAGridI,
	"Unique Paths in a Grid II": uniquePathsInAGridII,
	"Algorithmic Stock Trader I": algoTrade1,
	"Algorithmic Stock Trader II": algoTrade2,
	"Algorithmic Stock Trader III": algoTrade3,
	"Algorithmic Stock Trader IV": algoTrade4,
	"Find All Valid Math Expressions": findAllValidMathExpressions,
	"Find Largest Prime Factor": findLargestPrimeFactor,
	"Array Jumping Game": arrayJump,
	"Array Jumping Game II": arrayJump2,
	"HammingCodes: Integer to encoded Binary": hammingEncode,
	"HammingCodes: Encoded Binary to Integer": hammingDecode,
	"Total Ways to Sum": waysToSum,
	"Total Ways to Sum II": waysToSum2,
	"Shortest Path in a Grid": shortestPath
}

export async function trySolveContract(ns, contract) {
	const server = contract.server
	const file = contract.file
	const type = ns.codingcontract.getContractType(file, server)
	const param = ns.codingcontract.getData(file, server)
	if (problemSolverMap[type]) {
		const answer = problemSolverMap[type](ns, param)
		ns.print("solution to problem '" + type + "' is : " + answer)
		// const reward = "test answer is " + answer + " for question: " + type
		const reward = ns.codingcontract.attempt(answer, file, server, { returnReward: true })
		if (!reward) {
			const errorMessage = "Failed question '" + type + "' with input '" + param + "'. Wrong answer is: " + answer
			ns.toast(errorMessage, 'error', 600000)
			await ns.write("/coding-contract-errors.log", errorMessage + "\n", 'a')
		} else {
			ns.print(reward)
			ns.toast(reward)
		}
	} else {
		ns.print("Below type of problem is not encountered before (at " + server + ")")
		ns.print(type)
		ns.print("===")
		ns.print(ns.codingcontract.getDescription(file, server))
	}
}

export async function trySolveAllContracts(ns) {
	const contracts = findAllContracts(ns)
	ns.print("Found " + contracts.length + " contracts.")
	for (const contract of contracts) {
		await trySolveContract(ns, contract)
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	// ns.tail()
	ns.disableLog('ALL')
	ns.clearLog()
	await trySolveAllContracts(ns)
}