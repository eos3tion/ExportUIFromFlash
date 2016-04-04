//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON#Polyfill
JSON = {
	parse: function (sJSON) {
		return eval('(' + sJSON + ')');
	},
	stringify: (function () {
		var toString = Object.prototype.toString;
		var isArray = Array.isArray || function (a) {
				return toString.call(a) === '[object Array]';
			};
		var escMap = {
			'"': '\\"',
			'\\': '\\\\',
			'\b': '\\b',
			'\f': '\\f',
			'\n': '\\n',
			'\r': '\\r',
			'\t': '\\t'
		};
		var escFunc = function (m) {
			return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1);
		};
		var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
		return function stringify(value, depth) {
			depth = depth || 0;
			depth++;
			if (value == null) {
				return 'null';
			} else if (typeof value === 'number') {
				return isFinite(value) ? value.toString() : 'null';
			} else if (typeof value === 'boolean') {
				return value.toString();
			} else if (typeof value === 'object') {
				//if (depth > 100) {
					//return value.toString();
				//}
				if (isArray(value)) {
					var res = '[';
					for (var i = 0; i < value.length; i++)
						res += (i ? ', ' : '') + stringify(value[i], depth);
					return res + ']';
				} else { //if (toString.call(value) === '[object Object]') { //屏蔽的原因是 FlashItem FlashInstance会输出为 [object Item] [object Instance]
					var tmp = [];
					for (var k in value) {
						if (["brightness", "tintColor", "tintPercent"].indexOf(k) == -1) //这三个属性会无故报错
						tmp.push(stringify(k, depth) + ': ' + stringify(value[k], depth));
					}
					return '{' + tmp.join(', ') + '}';
				}
			}
			return '"' + value.toString().replace(escRE, escFunc) + '"';
		};
	})()
};