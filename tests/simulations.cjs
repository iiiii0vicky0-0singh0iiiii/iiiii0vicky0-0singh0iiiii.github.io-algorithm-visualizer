const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/simulations.js'),'utf8')+'\nthis.sim=Sim;',context);
const sim=context.sim;
const json=x=>JSON.parse(JSON.stringify(x));
const last=(id,ex)=>sim.run(id,ex).at(-1);
const ids=['bfs','dfs','dijkstra','astar','greedy-best','bubble','selection','insertion','merge','quick','heap','binary','linear','prim','kruskal','topological','knapsack','lcs','activity','huffman'];
for(const id of ids){const frames=sim.run(id,sim.makeExample());assert(frames.length>1,id);assert(frames.at(-1).done,id);assert(frames.every(f=>f.message&&f.recipe>=0&&f.recipe<4),id);}

function routeCost(ex,weighted){
  const g=ex.grid,n=g.rows*g.cols,d=Array(n).fill(Infinity);d[g.start]=0;
  // Independent repeated relaxation, rather than the simulator's queue/heap.
  for(let pass=0;pass<n;pass++){let changed=false;for(let u=0;u<n;u++){if(g.walls.includes(u)||!Number.isFinite(d[u]))continue;for(let v=0;v<n;v++){if(g.walls.includes(v))continue;const adjacent=Math.abs(Math.floor(u/g.cols)-Math.floor(v/g.cols))+Math.abs(u%g.cols-v%g.cols)===1;if(adjacent&&d[u]+(weighted?g.weights[v]:1)<d[v]){d[v]=d[u]+(weighted?g.weights[v]:1);changed=true;}}}if(!changed)break;}return d[g.goal];
}
function bestKnapsack(ex){let best=0;for(let mask=0;mask<(1<<ex.items.length);mask++){let weight=0,value=0;ex.items.forEach((item,i)=>{if(mask>>i&1){weight+=item[1];value+=item[2];}});if(weight<=ex.capacity)best=Math.max(best,value);}return best;}
function subsequence(s,word){let i=0;for(const c of word)if(c===s[i])i++;return i===s.length;}
function bestLCS([x,y]){let best=0;for(let mask=0;mask<(1<<x.length);mask++){const s=[...x].filter((_,i)=>mask>>i&1).join('');if(subsequence(s,y))best=Math.max(best,s.length);}return best;}
function bestActivities(ex){let best=0;for(let mask=0;mask<(1<<ex.activities.length);mask++){const selected=ex.activities.filter((_,i)=>mask>>i&1).sort((a,b)=>a[1]-b[1]);if(selected.every((a,i)=>!i||a[1]>=selected[i-1][2]))best=Math.max(best,selected.length);}return best;}
function bestTree(ex){let best=Infinity;for(let mask=0;mask<(1<<ex.edges.length);mask++){const edges=ex.edges.filter((_,i)=>mask>>i&1);if(edges.length!==6)continue;const reached=new Set(['A']);for(let pass=0;pass<7;pass++)for(const [a,b] of edges){if(reached.has(a))reached.add(b);if(reached.has(b))reached.add(a);}if(reached.size===7)best=Math.min(best,edges.reduce((s,e)=>s+e[2],0));}return best;}

for(let trial=0;trial<8;trial++){
  const ex=sim.makeExample(trial>0);
  for(const id of ['bubble','selection','insertion','merge','quick','heap']){const frames=sim.run(id,ex);const expected=json(ex.values).sort((a,b)=>a-b);assert.deepEqual(json(frames.at(-1).array),expected,id);for(const frame of frames)assert.deepEqual(json(frame.array).sort((a,b)=>a-b),expected,`${id} lost a value in its animation`);}
  for(const id of ['bfs','dijkstra','astar']){const f=last(id,ex);assert(f.found,id);assert.equal(f.cost,routeCost(ex,id!=='bfs'),id);assert.equal(f.path[0],ex.grid.start);assert.equal(f.path.at(-1),ex.grid.goal);assert(f.path.every(i=>!ex.grid.walls.includes(i)));}
  for(const id of ['binary','linear']){let f=last(id,ex);assert.equal(f.array[f.found],ex.target,id);const missing=json(ex);missing.target=99;assert.equal(last(id,missing).found,undefined,id);}
  for(const capacity of [5,10,12]){const sample=json(ex);sample.capacity=capacity;const f=last('knapsack',sample);assert.equal(f.table.at(-1).at(-1),bestKnapsack(sample));assert(f.weight<=capacity);assert.equal(f.chosen.reduce((s,i)=>s+sample.items[i][2],0),f.table.at(-1).at(-1));}
  const common=last('lcs',ex);assert(subsequence(common.answer,ex.words[0])&&subsequence(common.answer,ex.words[1]));assert.equal(common.answer.length,bestLCS(ex.words));
  const treeCost=bestTree(ex);assert.equal(last('prim',ex).cost,treeCost);assert.equal(last('kruskal',ex).cost,treeCost);
  const topo=sim.run('topological',ex);assert.equal(topo[0].order.length,0,'Earlier snapshots must not mutate');const ordered=topo.at(-1);assert(ordered.edges.every(([a,b])=>ordered.order.indexOf(a)<ordered.order.indexOf(b)));
  assert.equal(last('activity',ex).selected.length,bestActivities(ex));
  const huffman=last('huffman',ex),codes=Object.values(huffman.codes);assert(codes.every((c,i)=>codes.every((d,j)=>i===j||!d.startsWith(c))));assert.equal(huffman.forest[0].freq,ex.frequencies.reduce((s,x)=>s+x[1],0));
}
const blocked=sim.makeExample();blocked.grid.walls=[15,28,30,43];for(const id of ['bfs','dfs','dijkstra','astar','greedy-best'])assert.equal(last(id,blocked).found,false,id);
assert.equal(last('huffman',sim.makeExample()).total,224);
const custom=sim.makeExample();custom.values=[-4,2.5,2.5,100,0];for(const id of ['bubble','selection','insertion','merge','quick','heap'])assert.deepEqual(json(last(id,custom).array),[-4,0,2.5,2.5,100],`${id} custom numbers`);
custom.words=['A🌟B!','🌟!'];assert.equal(last('lcs',custom).answer,'🌟!');
custom.frequencies=[['🌟',7]];assert.deepEqual(json(last('huffman',custom).codes),{'🌟':'0'});
custom.graphNodes=[['Start',50,50],['2',200,70],['★',350,150],['End',450,280]];custom.edges=[['Start','2',4],['2','★',-2],['★','End',3],['Start','End',20],['2','End',8]];
assert.equal(last('prim',custom).cost,5);assert.equal(last('kruskal',custom).cost,5);
custom.topoEdges=[['Start','2'],['2','★'],['★','End']];assert.equal(last('topological',custom).found,true);assert.deepEqual(json(last('topological',custom).order),['Start','2','★','End']);
custom.topoEdges=[['Start','2'],['2','★'],['★','Start']];assert.equal(last('topological',custom).found,false);
console.log('PASS: all 20 simulations; randomized sorting, independent shortest paths, exhaustive knapsack/MST/activity optima, LCS, prefix codes, unreachable maps, immutable snapshots.');
