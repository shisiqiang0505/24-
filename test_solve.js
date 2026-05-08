// 提取 solve24 算法，测试 6,1,3,4 是否产生错误解法
function solve24(nums) {
  var solutions = {};
  var ep = 1e-9;

  function permute(arr) {
    var result = [];
    function backtrack(cur, remain) {
      if (remain.length === 0) { result.push(cur.slice()); return; }
      for (var i = 0; i < remain.length; i++) {
        if (i > 0 && remain[i] === remain[i-1]) continue;
        cur.push(remain[i]);
        backtrack(cur, remain.slice(0,i).concat(remain.slice(i+1)));
        cur.pop();
      }
    }
    backtrack([], arr.slice().sort(function(a,b){return a-b;}));
    return result;
  }

  function applyOp(a, b, op) {
    if (op === '+') return [a + b];
    if (op === '-') return [a - b];
    if (op === '*') return [a * b];
    if (op === '/') return Math.abs(b) < ep ? [] : [a / b];
    return [];
  }

  function formatExpr(a, b, op) {
    if (op === '+') return '(' + a + '+' + b + ')';
    if (op === '-') return '(' + a + '-' + b + ')';
    if (op === '*') {
      var aN = a.indexOf('+') !== -1 || a.indexOf('-') !== -1;
      var bN = b.indexOf('+') !== -1 || b.indexOf('-') !== -1;
      return '(' + (aN ? '('+a+')' : a) + '*' + (bN ? '('+b+')' : b) + ')';
    }
    if (op === '/') {
      var aN = a.indexOf('+') !== -1 || a.indexOf('-') !== -1;
      return '(' + (aN ? '('+a+')' : a) + '/' + b + ')';
    }
    return '';
  }

  function simplifyExpr(expr) {
    if (expr.charAt(0) === '(' && expr.charAt(expr.length-1) === ')') {
      var depth = 0, removable = true;
      for (var i = 0; i < expr.length-1; i++) {
        if (expr.charAt(i) === '(') depth++;
        if (expr.charAt(i) === ')') depth--;
        if (depth === 0) { removable = false; break; }
      }
      if (removable) expr = expr.slice(1, -1);
    }
    return expr;
  }

  function normalizeExpr(expr) {
    function strip(expr) {
      while (true) {
        if (expr.charAt(0) === '(' && expr.charAt(expr.length-1) === ')') {
          var depth = 0, safe = true;
          for (var i = 0; i < expr.length-1; i++) {
            if (expr.charAt(i) === '(') depth++;
            if (expr.charAt(i) === ')') depth--;
            if (depth === 0) { safe = false; break; }
          }
          if (safe) { expr = expr.slice(1, -1); continue; }
        }
        break;
      }
      return expr;
    }
    function normalizeTop(expr, topOps) {
      expr = strip(expr);
      var depth = 0;
      var parts = [];
      var cur = '';
      for (var i = 0; i < expr.length; i++) {
        var ch = expr.charAt(i);
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (depth === 0 && topOps.indexOf(ch) !== -1) {
          parts.push(cur);
          cur = '';
          continue;
        }
        cur += ch;
      }
      parts.push(cur);
      if (parts.length <= 1) return strip(expr);
      var normalizedParts = parts.map(function(p) { return normalizeTop(p, topOps); });
      var sep = '';
      for (var j = 0; j < expr.length; j++) {
        if (expr.charAt(j) === '(') depth++;
        else if (expr.charAt(j) === ')') depth--;
        else if (depth === 0 && topOps.indexOf(expr.charAt(j)) !== -1) { sep = expr.charAt(j); break; }
      }
      return normalizedParts.join(sep);
    }
    var result = normalizeTop(expr, '+-');
    var depth2 = 0;
    var segments = [];
    var cur2 = '';
    for (var k = 0; k < result.length; k++) {
      var c = result.charAt(k);
      if (c === '(') depth2++;
      else if (c === ')') depth2--;
      else if (depth2 === 0 && (c === '+' || c === '-')) {
        segments.push(cur2);
        cur2 = '';
        continue;
      }
      cur2 += c;
    }
    segments.push(cur2);
    if (segments.length > 1) {
      return segments.map(function(s) { return normalizeTop(s, '*/'); }).join('+'.indexOf(result) !== -1 ? '+' : '-');
    }
    return normalizeTop(result, '*/');
  }

  var ops = ['+','-','*','/'];
  var perms = permute(nums);

  for (var p = 0; p < perms.length; p++) {
    var a = perms[p][0], b = perms[p][1], c = perms[p][2], d = perms[p][3];
    for (var o1 = 0; o1 < 4; o1++) {
      var op1 = ops[o1];
      for (var o2 = 0; o2 < 4; o2++) {
        var op2 = ops[o2];
        for (var o3 = 0; o3 < 4; o3++) {
          var op3 = ops[o3];
          // ((a op1 b) op2 c) op3 d
          var r = applyOp(a, b, op1);
          if (r.length) {
            var r2 = applyOp(r[0], c, op2);
            if (r2.length) {
              var r3 = applyOp(r2[0], d, op3);
              if (r3.length && Math.abs(r3[0]-24) < ep) {
                var expr = formatExpr(formatExpr(String(a),String(b),op1), String(c), op2);
                expr = formatExpr(expr, String(d), op3);
                expr = simplifyExpr(expr);
                if (expr) solutions[expr] = true;
              }
            }
          }
          // (a op1 (b op2 c)) op3 d
          r = applyOp(b, c, op2);
          if (r.length) {
            r2 = applyOp(a, r[0], op1);
            if (r2.length) {
              r3 = applyOp(r2[0], d, op3);
              if (r3.length && Math.abs(r3[0]-24) < ep) {
                var expr = formatExpr(String(a), formatExpr(String(b),String(c),op2), op1);
                expr = formatExpr(expr, String(d), op3);
                expr = simplifyExpr(expr);
                if (expr) solutions[expr] = true;
              }
            }
          }
          // a op1 ((b op2 c) op3 d)
          r = applyOp(b, c, op2);
          if (r.length) {
            r2 = applyOp(r[0], d, op3);
            if (r2.length) {
              r3 = applyOp(a, r2[0], op1);
              if (r3.length && Math.abs(r3[0]-24) < ep) {
                var expr = formatExpr(String(a), formatExpr(formatExpr(String(b),String(c),op2), String(d), op3), op1);
                expr = simplifyExpr(expr);
                if (expr) solutions[expr] = true;
              }
            }
          }
          // a op1 (b op2 (c op3 d))
          r = applyOp(c, d, op3);
          if (r.length) {
            r2 = applyOp(b, r[0], op2);
            if (r2.length) {
              r3 = applyOp(a, r2[0], op1);
              if (r3.length && Math.abs(r3[0]-24) < ep) {
                var expr = formatExpr(String(a), formatExpr(String(b), formatExpr(String(c),String(d),op3), op2), op1);
                expr = simplifyExpr(expr);
                if (expr) solutions[expr] = true;
              }
            }
          }
          // (a op1 b) op2 (c op3 d)
          r = applyOp(a, b, op1);
          var r4 = applyOp(c, d, op3);
          if (r.length && r4.length) {
            r3 = applyOp(r[0], r4[0], op2);
            if (r3.length && Math.abs(r3[0]-24) < ep) {
              var expr = formatExpr(formatExpr(String(a),String(b),op1), formatExpr(String(c),String(d),op3), op2);
              expr = simplifyExpr(expr);
              if (expr) solutions[expr] = true;
            }
          }
        }
      }
    }
  }
  var normalized = {};
  var rawKeys = Object.keys(solutions);
  for (var ni = 0; ni < rawKeys.length; ni++) {
    normalized[normalizeExpr(rawKeys[ni])] = true;
  }
  return Object.keys(normalized);
}

// 测试 6,1,3,4
var sol = solve24([6,1,3,4]);
console.log('解法数量:', sol.length);
for (var i = 0; i < sol.length; i++) {
  // 计算实际值
  try {
    var val = eval(sol[i]);
    console.log((i+1) + '. ' + sol[i] + ' = ' + val + (Math.abs(val-24) < 1e-9 ? '  ✓' : '  ✗✗✗ WRONG'));
  } catch(e) {
    console.log((i+1) + '. ' + sol[i] + '  EVAL ERROR');
  }
}
