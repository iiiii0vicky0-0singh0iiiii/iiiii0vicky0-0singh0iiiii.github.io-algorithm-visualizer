'use strict';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const byId=Object.fromEntries(algorithms.map(a=>[a.id,a]));
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={id:byId[location.hash.slice(1)]?location.hash.slice(1):'bfs',example:Sim.makeExample(),frames:[],index:0,playing:false,timer:null,speed:760,tool:'wall',mounted:null,lastFrame:null,tableOpen:false,dragGraph:null};
const icons={
  route:'<path d="M4 19h4a4 4 0 0 0 0-8H7a4 4 0 0 1 0-8h10M14 1l4 2-4 2"/><circle cx="4" cy="19" r="2"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 6-5 2 3-6z"/>',
  bars:'<path d="M3 21V11h4v10m3 0V4h4v17m3 0V8h4v13M1 21h22"/>',
  cards:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="m10 9 4 6m0-6-4 6M2 6v12m20-12v12"/>',
  split:'<path d="M12 3v7M5 21v-6l7-5 7 5v6M2 18l3 3 3-3m8 0 3 3 3-3"/>',
  network:'<circle cx="5" cy="5" r="3"/><circle cx="19" cy="8" r="3"/><circle cx="9" cy="20" r="3"/><path d="m8 6 8 1M6 8l2 9m3 1 6-8"/>',
  checklist:'<path d="m3 5 2 2 3-4m-5 9 2 2 3-4m-5 9 2 2 3-4M11 5h10m-10 7h10m-10 7h10"/>',
  bag:'<rect x="5" y="6" width="14" height="16" rx="4"/><path d="M9 6V4a3 3 0 0 1 6 0v2M8 14h8v5H8zM5 10H3v8m16-8h2v8"/>',
  letters:'<path d="m3 19 5-14 5 14M5 14h6M16 5h3a3 3 0 0 1 0 6h-3V5zm0 6h3a4 4 0 0 1 0 8h-3v-8z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M7 2v6m10-6v6M7 14h2m3 0h2m3 0h1M7 18h2m3 0h2"/>',
  tree:'<circle cx="12" cy="4" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 7-4 8m8-8 4 8"/>',
  start:'<path d="m8 5 8 7-8 7"/>', flag:'<path d="M6 21V3m0 0c4-4 8 4 12 0v9c-4 4-8-4-12 0"/>',
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16"/>',
  rope:'<path d="M9 7c-7-7-10 10 0 8s9-8 12-3-2 9-6 5-6-15-3-15 2 20-3 20"/>',
  water:'<path d="M9 2h6v5l3 4v10H6V11l3-4V2zm0 3h6M6 14h12"/>',
  food:'<path d="M5 13h14l-2 8H7l-2-8zm1-3h12M8 7V3m4 4V2m4 5V3"/>',
  radio:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M5 8 18 2M6 12h6m-6 3h6m-6 3h6"/><circle cx="17" cy="14" r="2"/>'
};
function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.route}</svg>`;}

function buildNav(){
  const groupIcons={Pathfinding:'route',Sorting:'bars',Searching:'cards',Graph:'network','Dynamic Programming':'bag',Greedy:'compass'};
  $('#algorithm-nav').innerHTML=[...new Set(algorithms.map(a=>a.category))].map(category=>`<div class="nav-group"><div class="nav-group-title">${icon(groupIcons[category])}${category==='Dynamic Programming'?'Clever choices':category}</div>${algorithms.filter(a=>a.category===category).map(a=>`<button class="algorithm-link" data-algorithm="${a.id}"><span class="nav-num">${String(algorithms.indexOf(a)+1).padStart(2,'0')}</span><span class="nav-name">${a.name}</span><span class="nav-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`).join('');
  $('#algorithm-nav').addEventListener('click',event=>{const button=event.target.closest('[data-algorithm]');if(button)selectAlgorithm(button.dataset.algorithm);});
}
function closeMenu(){document.body.classList.remove('menu-open');$('#menu-scrim').hidden=true;$('#menu-button').setAttribute('aria-expanded','false');}
function selectAlgorithm(id,updateURL=true){
  if(!Object.hasOwn(byId,id))throw new Error('Unknown algorithm');
  stop();state.id=id;state.tableOpen=false;state.tool='wall';rebuild();updateLesson();closeMenu();
  if(updateURL)history.replaceState(null,'',`#${id}`);
  const section=$('.lesson-head');section.classList.remove('enter-lesson');void section.offsetWidth;section.classList.add('enter-lesson');
}
function rebuild(){stop();state.frames=Sim.run(state.id,state.example);state.index=0;state.mounted=null;state.lastFrame=null;$('#visual-stage').innerHTML='';updateTools();render();}
function updateLesson(){
  const a=byId[state.id],l=lessons[state.id];
  $('#lesson-number').textContent=`Lesson ${String(algorithms.indexOf(a)+1).padStart(2,'0')}`;
  $('#eyebrow').textContent=friendlyCategories[a.category];$('#category-label').textContent=a.category;$('#algorithm-label').textContent=a.name;
  $('#algorithm-title').textContent=l.title;$('#algorithm-summary').textContent=`The idea behind ${l.subtitle}`;$('#scene-title').textContent=l.scene;
  $('#story-icon').innerHTML=icon(l.icon);$('#story-title').textContent=l.storyTitle;$('#story-copy').textContent=l.story;$('#story-rule').textContent=l.rule;
  $('#recipe-steps').innerHTML=l.steps.map((step,i)=>`<li data-recipe="${i}"><span class="recipe-number">${i+1}</span><span>${step}</span></li>`).join('');
  $('#try-copy').textContent=l.experiment;$('#takeaway-copy').textContent=l.aha;
  $('#technical-title').textContent=l.subtitle;$('#technical-summary').textContent=a.summary;
  $('#time-complexity').textContent=['astar','greedy-best'].includes(state.id)?'O((V + E) log V)':a.time;
  $('#space-complexity').textContent=a.space;
  $('#code-content code').innerHTML=a.code.map(line=>`<span class="code-line">${escapeHtml(line)}</span>`).join('');
  $('#technical-glossary').textContent='';
  $$('.algorithm-link').forEach(button=>{const active=button.dataset.algorithm===state.id;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  $('#randomize-button').hidden=state.id==='topological';
  const legends={grid:[['#2b604b','You'],['#dd7243','Destination'],['#829780','Wall'],['#c7dfca','Explored'],['#f1e6bc','Waiting'],['#efb360','Route']],bars:[['#c2d8bd','Number'],['#efb98e','Looking here'],['#7fab8c',state.id==='insertion'?'Ordered so far':'In place']],search:[['#fff','Still possible'],['#f8d5b3','Checking'],['#2b604b','Found']],graph:[['#c9d2be','Possible connection'],['#dd7243','Considering'],['#2b604b','Chosen']],knapsack:[['#fff2df','Considering'],['#e3efda','In this bag']],lcs:[['#f3d19d','Comparing'],['#e4daef','Earlier answer'],['#2b604b','Shared letters']],activity:[['#e5eddc','Available'],['#dd7243','Considering'],['#2b604b','On the schedule']],huffman:[['#e7f0dd','A group'],['#dd7243','Joining next']]};
  $('#legend').innerHTML=legends[state.frames[0].kind].map(([color,label])=>`<span><i style="background:${color}"></i>${label}</span>`).join('');
  render();
}
function graphEditorMarkup(){
  const directed=state.id==='topological',nodes=state.example.graphNodes,edges=directed?state.example.topoEdges:state.example.edges;
  const options=nodes.map((node,i)=>`<option value="${escapeHtml(node[0])}">${escapeHtml(node[0])}</option>`).join('');
  const edgeChips=edges.map((edge,i)=>`<span class="edge-chip">${escapeHtml(edge[0])}${directed?' → ':' — '}${escapeHtml(edge[1])}${directed?'':` · ${edge[2]}`}<button type="button" data-remove-edge="${i}" aria-label="Remove edge ${escapeHtml(edge[0])} to ${escapeHtml(edge[1])}">×</button></span>`).join('');
  return `<div class="graph-editor"><div class="editor-row"><label>Node label <input id="graph-node-label" type="text" maxlength="18" placeholder="Any letter or name" autocomplete="off"></label><button type="button" class="tool-chip primary-tool" id="add-graph-node">Add node</button>${nodes.map(node=>`<button type="button" class="node-chip" data-remove-node="${escapeHtml(node[0])}" title="Remove this node">${escapeHtml(node[0])}<span>×</span></button>`).join('')}</div><div class="editor-row"><label>${directed?'From':'Connect'} <select id="graph-from">${options}</select></label><label>${directed?'Before':'to'} <select id="graph-to">${nodes.map((node,i)=>`<option value="${escapeHtml(node[0])}" ${i===1?'selected':''}>${escapeHtml(node[0])}</option>`).join('')}</select></label>${directed?'':`<label>Weight <input id="graph-weight" type="number" value="1" step="any"></label>`}<button type="button" class="tool-chip primary-tool" id="add-graph-edge" ${nodes.length<2?'disabled':''}>Add ${directed?'arrow':'edge'}</button></div>${edgeChips?`<div class="edge-chip-list" aria-label="Current edges">${edgeChips}</div>`:''}<div class="tool-status" id="tool-status" role="status"></div></div>`;
}
function updateTools(){
  const kind=state.frames[0].kind;
  let html='';
  if(kind==='grid')html=`<span class="tool-hint">Click a square to change it</span>${[['wall','Walls'],['start','Move you'],['goal','Move flag']].map(([value,label])=>`<button class="tool-chip" data-tool="${value}" aria-pressed="${state.tool===value}">${label}</button>`).join('')}<button class="tool-chip" id="clear-walls">Clear walls</button>`;
  if(kind==='bars')html=`<div class="input-editor"><label>Numbers <input id="values-input" type="text" value="${escapeHtml(state.example.values.join(', '))}" aria-label="Numbers separated by commas"></label><button type="button" class="tool-chip primary-tool" id="apply-values">Use these numbers</button><span class="tool-hint">Separate values with commas.</span><span class="tool-status" id="tool-status" role="status"></span></div>`;
  if(kind==='search')html=`<div class="input-editor"><label>Number list <input id="values-input" type="text" value="${escapeHtml(state.example.values.join(', '))}" aria-label="Numbers separated by commas"></label><label>Find <input id="target-input" type="number" step="any" value="${state.example.target}"></label><button type="button" class="tool-chip primary-tool" id="apply-search">Use this input</button><span class="tool-status" id="tool-status" role="status"></span></div>`;
  if(kind==='knapsack')html=`<label>Bag limit <select id="capacity-select" aria-label="Bag weight limit">${[5,6,7,8,9,10,11,12].map(n=>`<option value="${n}" ${state.example.capacity===n?'selected':''}>${n} kg</option>`).join('')}</select></label><span class="tool-hint">Points tell us how useful an item is.</span>`;
  if(kind==='graph')html=graphEditorMarkup();
  if(kind==='activity')html='<span class="tool-hint">Numbers mark time. Overlapping events cannot share the room.</span>';
  if(kind==='lcs')html=`<div class="input-editor"><label>First text <input id="first-word-input" type="text" maxlength="30" value="${escapeHtml(state.example.words[0])}"></label><label>Second text <input id="second-word-input" type="text" maxlength="30" value="${escapeHtml(state.example.words[1])}"></label><button type="button" class="tool-chip primary-tool" id="apply-words">Compare these</button><span class="tool-status" id="tool-status" role="status"></span></div>`;
  if(kind==='huffman')html=`<div class="input-editor wide-editor"><label>Characters and frequencies <input id="frequency-input" type="text" value="${escapeHtml(state.example.frequencies.map(([letter,count])=>`${letter}:${count}`).join(', '))}" aria-label="Characters and frequencies"></label><button type="button" class="tool-chip primary-tool" id="apply-frequencies">Build this tree</button><span class="tool-hint">Example: A:5, B:9, ★:12</span><span class="tool-status" id="tool-status" role="status"></span></div>`;
  $('#scene-tools').innerHTML=html;
}
function render(){
  const f=state.frames[state.index],stage=$('#visual-stage'),fresh=state.mounted!==f.kind;
  stage.className=`visual-stage ${f.kind==='lcs'?'dp':f.kind}-stage`;
  const renderers={grid:renderGrid,bars:renderBars,search:renderSearch,graph:renderGraph,knapsack:renderKnapsack,lcs:renderLCS,activity:renderActivity,huffman:renderHuffman};
  renderers[f.kind](stage,f,fresh);
  $('#phase-label').textContent=f.phase.toUpperCase();$('#now-copy').textContent=f.message;$('#step-count').textContent=`${state.index+1} / ${state.frames.length}`;
  $('#narration').classList.toggle('done',!!f.done);$('#narration-symbol').textContent=f.done?(f.found===false?'!':'✓'):'→';
  if(f.done&&!state.lastFrame?.done){$('#narration-symbol').classList.remove('completion-mark');void $('#narration-symbol').offsetWidth;$('#narration-symbol').classList.add('completion-mark');}
  $('#back-button').disabled=state.index===0;$('#next-button').disabled=state.index===state.frames.length-1;
  const play=$('#play-button');play.querySelector('b').textContent=state.playing?'Pause here':f.done?'Watch again':'Watch it happen';play.querySelector('span').textContent=state.playing?'Ⅱ':'▶';play.setAttribute('aria-label',state.playing?'Pause visualization':'Play visualization');
  $('#progress-track').max=String(state.frames.length-1);$('#progress-track').value=String(state.index);$('#progress-track').setAttribute('aria-valuetext',`Step ${state.index+1} of ${state.frames.length}`);
  $$('.recipe li').forEach((el,i)=>el.classList.toggle('active',i===f.recipe));$$('.code-line').forEach((el,i)=>el.classList.toggle('active',i===f.line));
  state.mounted=f.kind;state.lastFrame=f;
}
function renderGrid(stage,f,fresh){
  const g=f.grid;
  if(fresh){stage.innerHTML=`<div class="grid-board" style="--cols:${g.cols}"></div>`;const board=stage.firstElementChild;for(let i=0;i<g.rows*g.cols;i++){const cell=document.createElement('button');cell.className='grid-cell';cell.dataset.index=i;cell.type='button';board.appendChild(cell);}}
  const visited=new Set(f.visited),waiting=new Set(f.frontier),path=new Set(f.path),old=state.lastFrame,weighted=!['bfs','dfs'].includes(state.id);
  $$('.grid-cell').forEach((cell,i)=>{
    const cls=['grid-cell'];if(g.walls.includes(i))cls.push('wall');if(waiting.has(i))cls.push('frontier');if(visited.has(i))cls.push('visited');if(i===f.current)cls.push('current');if(path.has(i))cls.push('path');if(i===g.start)cls.push('start');if(i===g.goal)cls.push('goal');
    const entered=(visited.has(i)&&!old?.visited?.includes(i))||(path.has(i)&&!old?.path?.includes(i));if(entered&&!fresh)cls.push('cell-arrive');
    const className=cls.join(' ');if(cell.className!==className)cell.className=className;
    const content=i===g.start?icon('start'):i===g.goal?icon('flag'):weighted&&!g.walls.includes(i)?`<small>${g.weights[i]}</small>`:'';
    if(cell.innerHTML!==content)cell.innerHTML=content;
    cell.setAttribute('aria-label',`Row ${Math.floor(i/g.cols)+1}, column ${i%g.cols+1}: ${i===g.start?'start':i===g.goal?'destination':g.walls.includes(i)?'wall':path.has(i)?'route':visited.has(i)?'explored':'open'}${weighted?`, cost ${g.weights[i]}`:''}`);
  });
  $('#scene-caption').textContent=weighted?'A square’s number is the effort needed to enter it.':f.visited.length?`${f.visited.length} places explored · ${f.frontier.length} waiting to be checked`:'The arrow is you. Your destination is the little flag.';
}
function renderBars(stage,f){
  const min=Math.min(...f.array),max=Math.max(...f.array),span=max-min||1;
  stage.innerHTML=`<div class="comparison" id="comparison"></div><div class="bars" style="--count:${f.array.length}" role="img">${f.array.map((value,i)=>`<div class="bar-slot ${f.active.includes(i)?'active':''} ${f.sorted.includes(i)?'sorted':''} ${f.pivot===value?'pivot':''} ${f.range&&(i<f.range[0]||i>f.range[1])?'dimmed':''}" style="transform:translateX(${i*100}%)"><div class="bar" style="height:${20+(value-min)/span*72}%"><b>${escapeHtml(value)}</b></div><span class="position-label">${i+1}</span></div>`).join('')}</div>`;
  $('.bars').setAttribute('aria-label',`Numbers in current order: ${f.array.join(', ')}`);
  const values=f.active.map(i=>f.array[i]);$('#comparison').innerHTML=values.length>=2?`<strong>${values[0]}</strong><span>${values[0]>values[1]?'>':values[0]<values[1]?'<':'='}</span><strong>${values[1]}</strong><span class="comparison-note">${values[0]} is ${values[0]>values[1]?'bigger than':values[0]<values[1]?'smaller than':'equal to'} ${values[1]}.</span>`:f.done?'✓ Smallest to largest. Every number has its place.':values.length?`<strong>${values[0]}</strong><span>Follow this number.</span>`:'Which two numbers would you compare first?';
  $('#scene-caption').textContent=`${f.comparisons} comparison${f.comparisons===1?'':'s'} · ${f.moves} ${['merge','insertion'].includes(state.id)?'move':'swap'}${f.moves===1?'':'s'} so far`;
}
function renderSearch(stage,f,fresh){
  if(fresh)stage.innerHTML=`<div class="search-cards"><div class="target-tag">We’re looking for <b>${escapeHtml(f.target)}</b></div><div class="card-row">${f.array.map((v,i)=>`<div class="number-card"><small>${i+1}</small>${escapeHtml(v)}</div>`).join('')}</div></div>`;
  $$('.number-card').forEach((node,i)=>{node.classList.toggle('checked',f.checked.includes(i));node.classList.toggle('active',f.active===i);node.classList.toggle('found',f.found===i);});
  $('#scene-caption').textContent=`${f.checks} ${f.checks===1?'card':'cards'} checked${state.id==='binary'?' · The cards are ordered from left to right, then top to bottom.':''}`;
}
function renderGraph(stage,f,fresh){
  const taskName=name=>f.tasks&&Object.hasOwn(f.tasks,name)?f.tasks[name]:name;
  if(fresh){const map=Object.fromEntries(f.nodes.map(n=>[n[0],n]));stage.innerHTML=`<div class="graph-wrap"><svg viewBox="0 0 500 345" role="img" aria-label="${f.directed?'Nodes joined by prerequisite arrows':'Nodes joined by weighted edges'}"><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 6 3 0 6Z" fill="#9ba98c"/></marker></defs>${f.edges.map((e,i)=>{const a=map[e[0]],b=map[e[1]];if(!a||!b)return '';const dx=b[1]-a[1],dy=b[2]-a[2],d=Math.hypot(dx,dy)||1,x1=a[1]+dx/d*25,y1=a[2]+dy/d*25,x2=b[1]-dx/d*27,y2=b[2]-dy/d*27;return `<g class="edge" data-edge="${i}" data-from="${escapeHtml(e[0])}" data-to="${escapeHtml(e[1])}"><line class="edge-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${f.directed?'marker-end="url(#arrow)"':''}/><line class="edge-paint" pathLength="1" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${f.directed?'':`<text x="${(a[1]+b[1])/2}" y="${(a[2]+b[2])/2-7}">${escapeHtml(e[2])}</text>`}</g>`;}).join('')}${f.nodes.map(n=>`<g class="graph-node" data-node="${escapeHtml(n[0])}" tabindex="0" role="button" aria-label="Node ${escapeHtml(n[0])}. Drag to reposition."><circle cx="${n[1]}" cy="${n[2]}" r="23"/><text class="node-letter" x="${n[1]}" y="${n[2]+5}" style="font-size:${Math.max(8,14-String(n[0]).length*.45)}px">${escapeHtml(n[0])}</text>${f.directed&&taskName(n[0])!==n[0]?`<text class="node-caption" x="${n[1]}" y="${n[2]+39}">${escapeHtml(taskName(n[0]))}</text>`:''}</g>`).join('')}</svg><div class="order-row"></div><div class="graph-total"></div></div>`;}
  $$('.edge').forEach((node,i)=>{node.classList.toggle('selected',f.directed?f.visited.includes(f.edges[i][0]):f.selected.includes(i));node.classList.toggle('active',f.active===i);});
  $$('.graph-node').forEach(node=>node.classList.toggle('visited',f.visited.includes(node.dataset.node)));
  $('.order-row').innerHTML=f.order?.map((n,i)=>`${i?'<b>→</b>':''}<span>${escapeHtml(taskName(n))}</span>`).join('')||'';
  $('.graph-total').innerHTML=f.directed?'':`Edges chosen: <b>${f.selected.length}</b> &nbsp; Total weight: <b>${f.selected.reduce((sum,i)=>sum+f.edges[i][2],0)}</b>`;
  $('#scene-caption').textContent=f.directed?'An arrow points from a prerequisite to what it unlocks. Drag any node to arrange the graph.':'Green edges belong to the minimum network. Drag any node to arrange the graph.';
}
function tableMarkup(f){return `<div class="dp-scroll"><div class="dp-table" role="img" aria-label="Table of best answers to smaller problems" style="grid-template-columns:50px repeat(${f.cols.length},minmax(27px,1fr))"><div class="dp-cell head"></div>${f.cols.map(c=>`<div class="dp-cell head">${escapeHtml(c)}</div>`).join('')}${f.table.map((row,i)=>`<div class="dp-cell head">${escapeHtml(f.rows[i])}</div>${row.map((v,j)=>{const current=f.current?.[0]===i&&f.current?.[1]===j,source=f.source.some(p=>p[0]===i&&p[1]===j),route=f.route?.some(p=>p[0]===i&&p[1]===j),pending=i>0&&j>0&&!f.done&&(!f.current||i>f.current[0]||i===f.current[0]&&j>f.current[1]);return `<div class="dp-cell ${current?'current':''} ${source?'source':''} ${route?'route':''} ${pending?'pending':''}">${pending?'·':escapeHtml(v)}</div>`;}).join('')}`).join('')}</div></div>`;}
function renderKnapsack(stage,f,fresh){
  const tableScroll=stage.querySelector('.dp-scroll')?.scrollLeft||0,weight=f.chosen.reduce((sum,i)=>sum+f.items[i][1],0),bagSize=f.bagSize??f.capacity;
  stage.innerHTML=`<div class="packing-head"><span>${f.done?'Your winning bag':f.current?'Trying a smaller bag':'Your bag limit'}: <strong>${bagSize} kg</strong></span><div class="bag-meter" aria-label="${weight} of ${bagSize} kilograms used">${Array.from({length:bagSize},(_,i)=>`<i class="${i<weight?'filled':''}"></i>`).join('')}</div><span>${weight} kg packed</span></div><div class="item-cards">${f.items.map((item,i)=>`<div class="item-card ${f.item===i?'considering':''} ${f.chosen.includes(i)?'selected':''}"><span class="item-check">${f.chosen.includes(i)?'✓':''}</span>${icon(item[3])}<strong>${item[0]}</strong><small>${item[1]} kg · ${item[2]} points</small></div>`).join('')}</div>${f.done?`<div class="result-ribbon">Best usefulness score: <b>${f.table.at(-1).at(-1)} points</b></div>`:f.item!==undefined?`<div class="choice-comparison"><div class="choice-box ${f.take===null||f.skip>=f.take?'winner':''}">Leave ${f.items[f.item][0]}<b>${f.skip} points</b></div><span>or</span><div class="choice-box ${f.take!==null&&f.take>f.skip?'winner':''}">Take ${f.items[f.item][0]}<b>${f.take===null?'Too heavy':f.take+' points'}</b></div></div>`:'<div class="result-ribbon">Which combination would you pack?</div>'}<details class="table-disclosure" ${state.tableOpen?'open':''}><summary>See the notebook of smaller answers</summary>${tableMarkup(f)}</details>`;
  stage.querySelector('.table-disclosure').addEventListener('toggle',event=>{if(event.target.isConnected)state.tableOpen=event.target.open;});stage.querySelector('.dp-scroll').scrollLeft=tableScroll;
  $('#scene-caption').textContent=f.done?'Each item can be taken once. The chosen weights fit inside the limit.':'Each round compares two real choices. Green marks the more useful bag.';
}
function renderLCS(stage,f){
  const tableScroll=stage.querySelector('.dp-scroll')?.scrollLeft||0;
  stage.innerHTML=`<div class="string-pair">${[f.x,f.y].map((word,row)=>`<div class="string-row" aria-label="${escapeHtml(word)}">${[...word].map((letter,i)=>`<span class="letter-tile ${f.current?.[row]===i+1&&!f.done?'active':''} ${f.matches.some(pair=>pair[row]===i)?'matched':''}">${escapeHtml(letter)}</span>`).join('')}</div>`).join('')}</div>${f.done?`<div class="result-ribbon">Shared sequence: <b>${escapeHtml(f.answer)}</b></div>`:''}${tableMarkup(f)}`;
  stage.querySelector('.dp-scroll').scrollLeft=tableScroll;$('#scene-caption').textContent='A table cell remembers how many letters match in the two shorter word pieces.';
}
function renderActivity(stage,f,fresh){
  if(fresh)stage.innerHTML=`<div class="timeline"><div class="time-axis">${Array.from({length:15},(_,i)=>`<span>${i}</span>`).join('')}</div>${f.acts.map(a=>`<div class="activity-row"><span class="activity-label">${a[0]}</span><div class="activity" data-activity="${a[0]}" style="left:${a[1]/14*100}%;width:${(a[2]-a[1])/14*100}%">${a[1]}–${a[2]}</div></div>`).join('')}</div>`;
  $$('.activity').forEach(node=>{const name=node.dataset.activity;node.classList.toggle('selected',f.selected.includes(name));node.classList.toggle('active',f.current===name);node.classList.toggle('rejected',f.rejected.includes(name));});$('#scene-caption').textContent=`${f.selected.length} events chosen · The room is free from ${f.finish}.`;
}
function treeLayout(root){
  const nodes=[],edges=[];let leaves=0,maxDepth=0;
  const visit=(node,depth)=>{maxDepth=Math.max(depth,maxDepth);let x;if(node.left){const a=visit(node.left,depth+1),b=visit(node.right,depth+1);x=(a+b)/2;edges.push([node.id,node.left.id,'0'],[node.id,node.right.id,'1']);}else x=24+leaves++*48;nodes.push({...node,x,y:23+depth*48});return x;};visit(root,0);return {nodes,edges,width:Math.max(48,leaves*48),height:55+maxDepth*48};
}
function renderHuffman(stage,f){
  stage.innerHTML=`<div class="forest">${f.forest.map(root=>{const t=treeLayout(root),map=Object.fromEntries(t.nodes.map(n=>[n.id,n]));return `<div class="tree-card ${f.active.includes(root.id)?'active':''}" style="flex-grow:${t.width/48}"><svg viewBox="0 0 ${t.width} ${t.height}" role="img" aria-label="Group frequency ${root.freq}">${t.edges.map(([a,b,bit])=>`<line x1="${map[a].x}" y1="${map[a].y}" x2="${map[b].x}" y2="${map[b].y}"/>${f.done?`<text class="tree-edge-label" x="${(map[a].x+map[b].x)/2}" y="${(map[a].y+map[b].y)/2}">${bit}</text>`:''}`).join('')}${t.nodes.map(n=>`<g><circle cx="${n.x}" cy="${n.y}" r="15"/><text x="${n.x}" y="${n.y+4}">${n.freq}</text>${n.label?`<text x="${n.x}" y="${n.y+29}">${escapeHtml(n.label)}</text>`:''}</g>`).join('')}</svg></div>`;}).join('')}</div>${f.codes?`<div class="code-chips">${Object.entries(f.codes).sort().map(([letter,code])=>`<span><b>${escapeHtml(letter)}</b>${code}</span>`).join('')}</div>`:''}`;
  $('#scene-caption').textContent=f.done?'Read a code from the top to a letter: left = 0, right = 1.':'The orange groups are the next pair to join. Their numbers are added together.';
}

function stop(){state.playing=false;clearTimeout(state.timer);state.timer=null;}
function step(delta){if(!Number.isInteger(delta))throw new Error('Step count must be an integer');stop();state.index=Math.max(0,Math.min(state.frames.length-1,state.index+delta));render();}
function tick(){clearTimeout(state.timer);if(!state.playing)return;state.timer=setTimeout(()=>{if(!state.playing)return;state.index=Math.min(state.index+1,state.frames.length-1);if(state.index===state.frames.length-1)stop();render();if(state.playing)tick();},state.speed);}
function play(){if(state.playing){stop();render();return;}if(state.index===state.frames.length-1){state.index=0;state.lastFrame=null;}state.playing=true;render();tick();}
function randomize(){const capacity=state.example.capacity;state.example=Sim.makeExample(true);state.example.capacity=capacity;rebuild();}
function editCell(cell){const i=Number(cell.dataset.index),g=state.example.grid;if(state.tool==='start'||state.tool==='goal'){if(i===g[state.tool==='start'?'goal':'start'])return;g[state.tool]=i;g.walls=g.walls.filter(x=>x!==i);}else{if(i===g.start||i===g.goal)return;g.walls=g.walls.includes(i)?g.walls.filter(x=>x!==i):[...g.walls,i];}rebuild();}
function toolError(message){const status=$('#tool-status');if(status){status.textContent=message;status.classList.add('error');}}
function parseNumberList(value){const parts=value.trim().split(/[\s,]+/).filter(Boolean),numbers=parts.map(Number);if(!parts.length)throw new Error('Enter at least one number.');if(parts.length>30)throw new Error('Use up to 30 numbers so every step stays readable.');if(numbers.some(value=>!Number.isFinite(value)))throw new Error('Use numbers separated by commas.');return numbers;}
function applyValues(search=false){try{const values=parseNumberList($('#values-input').value);if(search){const target=Number($('#target-input').value);if(!Number.isFinite(target))throw new Error('Enter a number to find.');state.example.target=target;}state.example.values=values;rebuild();}catch(error){toolError(error.message);}}
function applyWords(){const first=$('#first-word-input').value,second=$('#second-word-input').value;if(!first||!second){toolError('Enter both pieces of text.');return;}state.example.words=[first,second];rebuild();}
function applyFrequencies(){try{const pairs=$('#frequency-input').value.split(',').map(part=>{const at=part.lastIndexOf(':'),label=part.slice(0,at).trim(),count=Number(part.slice(at+1).trim());if(at<1||!label||!Number.isFinite(count)||count<=0)throw new Error('Use entries like A:5, B:9, ★:12.');return [label,count];});if(!pairs.length||pairs.length>16)throw new Error('Enter between 1 and 16 character entries.');if(new Set(pairs.map(pair=>pair[0])).size!==pairs.length)throw new Error('Each character or label must be unique.');state.example.frequencies=pairs;rebuild();}catch(error){toolError(error.message);}}
function graphPosition(index){const angle=index*2.3999632297;return [250+Math.cos(angle)*Math.min(195,70+index*11),172+Math.sin(angle)*Math.min(125,48+index*7)];}
function addGraphNode(){const input=$('#graph-node-label'),label=input.value.trim();if(!label){toolError('Type a label for the new node.');return;}if(state.example.graphNodes.some(node=>node[0]===label)){toolError('Node labels must be unique.');return;}const [x,y]=graphPosition(state.example.graphNodes.length);state.example.graphNodes.push([label,x,y]);rebuild();}
function removeGraphNode(label){state.example.graphNodes=state.example.graphNodes.filter(node=>node[0]!==label);state.example.edges=state.example.edges.filter(edge=>edge[0]!==label&&edge[1]!==label);state.example.topoEdges=state.example.topoEdges.filter(edge=>edge[0]!==label&&edge[1]!==label);delete state.example.tasks[label];rebuild();}
function addGraphEdge(){const from=$('#graph-from').value,to=$('#graph-to').value,directed=state.id==='topological',edges=directed?state.example.topoEdges:state.example.edges;if(!from||!to||from===to){toolError('Choose two different nodes.');return;}const duplicate=edges.some(edge=>directed?edge[0]===from&&edge[1]===to:(edge[0]===from&&edge[1]===to)||(edge[0]===to&&edge[1]===from));if(duplicate){toolError(`That ${directed?'arrow':'edge'} already exists.`);return;}if(directed)edges.push([from,to]);else{const weight=Number($('#graph-weight').value);if(!Number.isFinite(weight)){toolError('Enter a valid edge weight.');return;}edges.push([from,to,weight]);}rebuild();}
function removeGraphEdge(index){const edges=state.id==='topological'?state.example.topoEdges:state.example.edges;edges.splice(index,1);rebuild();}
function updateGraphLayout(svg){
  const map=Object.fromEntries(state.example.graphNodes.map(node=>[node[0],node]));
  svg.querySelectorAll('.graph-node').forEach(group=>{const node=map[group.dataset.node];if(!node)return;const [,x,y]=node,circle=group.querySelector('circle'),letter=group.querySelector('.node-letter'),caption=group.querySelector('.node-caption');circle.setAttribute('cx',x);circle.setAttribute('cy',y);letter.setAttribute('x',x);letter.setAttribute('y',y+5);if(caption){caption.setAttribute('x',x);caption.setAttribute('y',y+39);}});
  svg.querySelectorAll('.edge').forEach(group=>{const a=map[group.dataset.from],b=map[group.dataset.to];if(!a||!b)return;const dx=b[1]-a[1],dy=b[2]-a[2],distance=Math.hypot(dx,dy)||1,coords={x1:a[1]+dx/distance*25,y1:a[2]+dy/distance*25,x2:b[1]-dx/distance*27,y2:b[2]-dy/distance*27};group.querySelectorAll('line').forEach(line=>Object.entries(coords).forEach(([name,value])=>line.setAttribute(name,value)));const text=group.querySelector('text');if(text){text.setAttribute('x',(a[1]+b[1])/2);text.setAttribute('y',(a[2]+b[2])/2-7);}});
}
function beginGraphDrag(event){const group=event.target.closest('.graph-node');if(!group||!state.frames[0]||state.frames[0].kind!=='graph')return;stop();state.dragGraph={label:group.dataset.node,pointerId:event.pointerId,target:group,moved:false};group.setPointerCapture?.(event.pointerId);event.preventDefault();}
function moveGraphNode(event){if(!state.dragGraph||event.pointerId!==state.dragGraph.pointerId)return;const svg=event.currentTarget.querySelector('.graph-wrap svg'),rect=svg.getBoundingClientRect(),node=state.example.graphNodes.find(node=>node[0]===state.dragGraph.label);if(!node)return;node[1]=Math.max(26,Math.min(474,(event.clientX-rect.left)/rect.width*500));node[2]=Math.max(26,Math.min(319,(event.clientY-rect.top)/rect.height*345));state.dragGraph.moved=true;updateGraphLayout(svg);}
function endGraphDrag(event){if(!state.dragGraph||event.pointerId!==state.dragGraph.pointerId)return;const moved=state.dragGraph.moved;state.dragGraph.target.releasePointerCapture?.(event.pointerId);state.dragGraph=null;if(moved)rebuild();}
function bindUI(){
  $('#play-button').addEventListener('click',play);$('#next-button').addEventListener('click',()=>step(1));$('#back-button').addEventListener('click',()=>step(-1));$('#restart-button').addEventListener('click',()=>{stop();state.index=0;render();});$('#randomize-button').addEventListener('click',randomize);
  $('#speed-select').addEventListener('change',event=>{state.speed=Number(event.target.value);document.documentElement.style.setProperty('--motion',`${Math.min(430,state.speed*.7)}ms`);if(state.playing)tick();});
  $('#progress-track').addEventListener('input',event=>{stop();state.index=Number(event.target.value);render();});
  $('#scene-tools').addEventListener('click',event=>{const tool=event.target.closest('[data-tool]');if(tool){state.tool=tool.dataset.tool;$$('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b===tool?'true':'false'));}if(event.target.closest('#clear-walls')){state.example.grid.walls=[];rebuild();return;}if(event.target.closest('#apply-values'))applyValues();else if(event.target.closest('#apply-search'))applyValues(true);else if(event.target.closest('#apply-words'))applyWords();else if(event.target.closest('#apply-frequencies'))applyFrequencies();else if(event.target.closest('#add-graph-node'))addGraphNode();else if(event.target.closest('#add-graph-edge'))addGraphEdge();else if(event.target.closest('[data-remove-node]'))removeGraphNode(event.target.closest('[data-remove-node]').dataset.removeNode);else if(event.target.closest('[data-remove-edge]'))removeGraphEdge(Number(event.target.closest('[data-remove-edge]').dataset.removeEdge));});
  $('#scene-tools').addEventListener('keydown',event=>{if(event.key!=='Enter')return;if(event.target.id==='values-input'){event.preventDefault();applyValues(state.frames[0].kind==='search');}else if(event.target.id==='target-input'){event.preventDefault();applyValues(true);}else if(['first-word-input','second-word-input'].includes(event.target.id)){event.preventDefault();applyWords();}else if(event.target.id==='frequency-input'){event.preventDefault();applyFrequencies();}else if(event.target.id==='graph-node-label'){event.preventDefault();addGraphNode();}});
  $('#scene-tools').addEventListener('change',event=>{if(event.target.id==='capacity-select'){state.example.capacity=Number(event.target.value);rebuild();}});
  const visualStage=$('#visual-stage');visualStage.addEventListener('click',event=>{const cell=event.target.closest('.grid-cell');if(cell)editCell(cell);});visualStage.addEventListener('pointerdown',beginGraphDrag);visualStage.addEventListener('pointermove',moveGraphNode);visualStage.addEventListener('pointerup',endGraphDrag);visualStage.addEventListener('pointercancel',endGraphDrag);
  $('#menu-button').addEventListener('click',()=>{const open=!document.body.classList.contains('menu-open');document.body.classList.toggle('menu-open',open);$('#menu-scrim').hidden=!open;$('#menu-button').setAttribute('aria-expanded',String(open));if(open)$('.algorithm-link.active')?.focus();});$('#menu-scrim').addEventListener('click',closeMenu);
  $('#help-button').addEventListener('click',()=>{stop();render();$('#help-dialog').showModal();});$('#close-help').addEventListener('click',()=>$('#help-dialog').close());$('#start-learning').addEventListener('click',()=>$('#help-dialog').close());$('#help-dialog').addEventListener('click',event=>{if(event.target===event.currentTarget){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();}});
  document.addEventListener('keydown',event=>{if($('#help-dialog').open)return;if(event.key==='Escape'){closeMenu();$('#menu-button').focus();return;}if(event.target.closest('input,select,textarea,[contenteditable=true]'))return;if(event.code==='Space'&&!event.target.closest('button,summary,a')){event.preventDefault();play();}if(event.key==='ArrowRight'){event.preventDefault();step(1);}if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}if(event.key.toLowerCase()==='r'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&state.id!=='topological')randomize();});
  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(Object.hasOwn(byId,id))selectAlgorithm(id,false);});
}
function registerWebMCP(){
  const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  const read=()=>({id:state.id,algorithm:byId[state.id].name,step:state.index+1,total:state.frames.length,explanation:state.frames[state.index].message});
  register({name:'select_algorithm',title:'Select a lesson',description:'Show one algorithm with its beginner story and visual steps.',inputSchema:{type:'object',properties:{id:{type:'string',enum:algorithms.map(a=>a.id)}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.id!=='string'||!Object.hasOwn(byId,input.id))throw new Error('Unknown algorithm id');selectAlgorithm(input.id);return read();}});
  register({name:'step_visualization',title:'Move through the lesson',description:'Move forward or backward by up to 100 steps and pause.',inputSchema:{type:'object',properties:{delta:{type:'integer',minimum:-100,maximum:100}},required:['delta'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Number.isInteger(input.delta)||Math.abs(input.delta)>100)throw new Error('delta must be an integer between -100 and 100');step(input.delta);return read();}});
  register({name:'read_visualization',title:'Read this step',description:'Read the visible lesson and explanation without changing it.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:read});
}
buildNav();rebuild();updateLesson();bindUI();registerWebMCP();
