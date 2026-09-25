// World 1 levels. One literal object per level so numbers can be hand-tuned.
// Field meanings: see ../levels.js. Values here reproduce the prototype's old
// levelDef(n) formulas exactly (checked by tools/check_levels.mjs).
export default [
  { world:1, level:1, theme:0, pattern:0, graves:0, total:8, interval:3.89, spMul:0.76, boss:false, pool:[['ghoul', 10]] },
  { world:1, level:2, theme:0, pattern:1, graves:0, total:9, interval:3.78, spMul:0.772, boss:false, pool:[['ghoul', 10]] },
  { world:1, level:3, theme:0, pattern:2, graves:1, total:11, interval:3.67, spMul:0.784, boss:false, pool:[['ghoul', 10], ['bat', 6]] },
  { world:1, level:4, theme:0, pattern:3, graves:1, total:12, interval:3.56, spMul:0.796, boss:false, pool:[['ghoul', 10], ['bat', 6]] },
  { world:1, level:5, theme:0, pattern:4, graves:1, total:11, interval:3.45, spMul:0.808, boss:true, pool:[['ghoul', 10], ['bat', 6], ['imp', 6]] },
  { world:1, level:6, theme:1, pattern:0, graves:2, total:16, interval:3.34, spMul:0.8200000000000001, boss:false, pool:[['ghoul', 10], ['bat', 6], ['imp', 6]] },
  { world:1, level:7, theme:1, pattern:1, graves:2, total:17, interval:3.23, spMul:0.8320000000000001, boss:false, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 4.4]] },
  { world:1, level:8, theme:1, pattern:2, graves:2, total:19, interval:3.12, spMul:0.844, boss:false, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 4.6]] },
  { world:1, level:9, theme:1, pattern:3, graves:2, total:20, interval:3.01, spMul:0.856, boss:false, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 4.8], ['wraith', 4]] },
  { world:1, level:10, theme:1, pattern:4, graves:3, total:19, interval:2.9, spMul:0.868, boss:true, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 5], ['wraith', 4]] },
  { world:1, level:11, theme:2, pattern:0, graves:3, total:18, interval:2.9, spMul:0.873, boss:false, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 5.2], ['wraith', 4]] },
  { world:1, level:12, theme:2, pattern:1, graves:3, total:19, interval:2.9, spMul:0.878, boss:false, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 5.4], ['wraith', 4]] },
  { world:1, level:13, theme:2, pattern:2, graves:4, total:20, interval:2.9, spMul:0.883, boss:false, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 5.6], ['wraith', 4]] },
  { world:1, level:14, theme:2, pattern:3, graves:4, total:21, interval:2.9, spMul:0.888, boss:false, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 5.800000000000001], ['wraith', 4]] },
  { world:1, level:15, theme:2, pattern:4, graves:4, total:20, interval:2.9, spMul:0.893, boss:true, pool:[['ghoul', 10], ['bat', 6], ['imp', 6], ['brute', 6], ['wraith', 4]] },
];
