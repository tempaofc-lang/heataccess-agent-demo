/* Browser-only adapter for the public GitHub Pages demonstration. */
(() => {
  const cache = new Map();
  async function read(path) {
    if (!cache.has(path)) cache.set(path, fetch(path).then(r => {
      if (!r.ok) throw Error(`数据文件 ${path} 加载失败 (${r.status})`);
      return r.json();
    }));
    return cache.get(path);
  }
  const fmt = n => Number(n).toLocaleString('zh-CN');
  function planQuery(query, minutes, speed) {
    if (!query.trim()) throw Error('请输入关于公园可达性的问题。');
    if (/上海|北京|武汉|杭州|深圳|广州|Brooklyn|Manhattan/i.test(query)) throw Error('目前数据只覆盖南布朗克斯的 10 个街区；其他地区需先导入对应数据。');
    if (!/公园|绿地|可达|覆盖|排名|薄弱|比较|敏感|报告|步行|人口|hvi|park|access/i.test(query)) throw Error('目前支持可达性排名、HVI 分组比较、5/10/15 分钟敏感性分析和报告。');
    const match = query.match(/(\d+(?:\.\d+)?)\s*分钟/);
    const top = query.match(/前\s*(\d+)/);
    const action = /敏感|5\/10\/15|阈值/.test(query) ? 'sensitivity' : (/比较|对比|分组/.test(query) ? 'compare' : (/报告/.test(query) ? 'report' : 'rank'));
    const requested = match && action !== 'sensitivity' ? Number(match[1]) : minutes;
    if (!Number.isInteger(requested) || requested < 5 || requested > 15) throw Error('静态演示支持 5–15 分钟的整数阈值。');
    if (![3, 4, 5].includes(speed)) throw Error('步速请选择 3、4 或 5 km/h。');
    const count = top ? Number(top[1]) : 5;
    if (count < 1 || count > 10) throw Error('排名数量应为 1–10。');
    return {action, minutes: requested, speed_kmh: speed, hvi_min: /高热|高风险|高脆弱/.test(query) ? 4 : 1, top: count};
  }
  async function ask(options) {
    const started = performance.now();
    const q = JSON.parse(options.body);
    const plan = planQuery(q.query, Number(q.minutes), Number(q.speed));
    const analyses = await read('./data/analyses.json');
    const result = analyses[`${plan.minutes}-${plan.speed_kmh}`];
    const rows = result.neighborhoods.filter(r => r.hvi >= plan.hvi_min).slice(0, plan.top);
    const trace = [
      {tool:'validate_scope', detail:'确认研究范围及支持的问题类型'},
      {tool:'network_accessibility', detail:`读取已计算路网距离，阈值 ${plan.minutes} 分钟，步速 ${plan.speed_kmh} km/h`},
    ];
    let answer;
    if (plan.action === 'sensitivity') {
      answer = '南布朗克斯研究区在 ' + result.sensitivity.map(v => `${v.minutes} 分钟下估计覆盖 ${v.coverage_pct}% 人口`).join('、') + '。这些比例包含未知人口在分母中。';
      trace.push({tool:'threshold_sensitivity', detail:'分别计算 5、10、15 分钟阈值'});
    } else if (plan.action === 'compare') {
      const levels = [...new Set(result.neighborhoods.map(r => r.hvi))].sort();
      answer = levels.map(h => {
        const group = result.neighborhoods.filter(r => r.hvi === h);
        const population = group.reduce((n, r) => n + r.population, 0);
        const covered = group.reduce((n, r) => n + r.covered, 0);
        return `HVI ${h} 级（${group.length} 个街区）人口加权可达率为 ${(100 * covered / population).toFixed(2)}%`;
      }).join('；') + '。样本只代表本研究区；HVI 含绿地因素，该差异不能作因果解释。';
    } else {
      const t = result.total;
      answer = `在 ${plan.minutes} 分钟、${plan.speed_kmh} km/h 情景下，南布朗克斯研究区估计覆盖 ${fmt(t.covered)} 人（${t.coverage_pct}%），已知未覆盖 ${fmt(t.uncovered)} 人，未知 ${fmt(t.unknown)} 人。`;
      if (rows.length) answer += ' 按已知未覆盖人口排序：' + rows.map(r => `${r.name}：${fmt(r.uncovered)} 人（HVI ${r.hvi}）`).join('；') + '。';
      if (plan.action === 'report') answer += ' 可通过“导出报告”保存本次分析。';
    }
    trace.push({tool:'evidence_bound_answer',detail:'回答数字直接引用已计算分析结果；保留未知人口和方法限制'});
    return {plan,answer,rows,trace,mode:'rules',warning:null,usage:null,
      elapsed_ms:Math.round(performance.now() - started),cost:null,
      cost_note:'静态演示使用预计算结果和浏览器规则解析，无模型调用费用。'};
  }
  window.heataccessStatic = {
    reportUrl:(minutes,speed)=>`./reports/${minutes}-${speed}.html`,
    async request(url, options) {
      const route = new URL(url, location.origin);
      if (route.pathname === '/api/data') return read('./data/dataset.json');
      if (route.pathname === '/api/status') return {ok:true,model_configured:false};
      if (route.pathname === '/api/entrance-audit') return read('./data/entrance_audit.json');
      if (route.pathname.startsWith('/api/geo/')) {
        const layer = route.pathname.split('/').pop();
        if (!['neighborhoods','parks','roads'].includes(layer)) throw Error('未知图层');
        return read(`./data/${layer}.geojson`);
      }
      if (route.pathname === '/api/analysis') {
        const minutes = Number(route.searchParams.get('minutes'));
        const speed = Number(route.searchParams.get('speed'));
        const analyses = await read('./data/analyses.json');
        const result = analyses[`${minutes}-${speed}`];
        if (!result) throw Error('静态演示支持 5–15 分钟和 3、4、5 km/h 的情景。');
        return result;
      }
      if (route.pathname === '/api/ask') return ask(options);
      throw Error(`静态演示不支持 ${route.pathname}`);
    },
  };
})();
