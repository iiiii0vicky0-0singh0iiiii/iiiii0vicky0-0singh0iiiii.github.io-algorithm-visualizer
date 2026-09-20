// Pure step generators. Every snapshot is independent, so rewind is exact.
const Sim = (() => {
  const copy=x=>JSON.parse(JSON.stringify(x));
  const seq=n=>Array.from({length:n},(_,i)=>i);
  const rand=(lo,hi)=>Math.floor(Math.random()*(hi-lo+1))+lo;
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=rand(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
  const frame=(frames,data)=>frames.push(copy({recipe:0,line:0,phase:'Ready when you are',...data}));
  const nodes=[['A',55,166],['B',155,58],['C',250,145],['D',383,57],['E',439,226],['F',280,293],['G',105,287]];
  const baseEdges=[['A','B',4],['A','G',7],['A','C',9],['B','C',2],['B','D',8],['C','D',3],['C','E',6],['C','F',4],['C','G',5],['D','E',5],['E','F',1],['F','G',3]];
  const directed=[['A','B'],['A','C'],['B','D'],['B','F'],['C','F'],['D','E'],['F','E'],['G','E']];
  const tasks={A:'Shop',B:'Wash',C:'Boil',D:'Chop',E:'Serve',F:'Cook',G:'Set table'};
  function makeExample(fresh=false){
    const rows=8,cols=14,start=29,goal=82;
    const corridor=new Set([...seq(12).map(i=>2*cols+i+1),...seq(4).map(i=>(i+2)*cols+12)]);
    const walls=fresh?seq(rows*cols).filter(i=>!corridor.has(i)&&i!==start&&i!==goal&&Math.random()<.18):[4,18,46,60,74,88,102,8,22,36,50,78,92,106,52,66,80,94];
    return {
      grid:{rows,cols,start,goal,walls,weights:seq(rows*cols).map(i=>fresh?([1,1,1,3,5][rand(0,4)]):i%9===0?3:i%17===0?5:1)},
      values:fresh?shuffle(seq(10).map(i=>i+1)):[7,3,9,2,6,4,10,1,8,5], target:fresh?rand(2,10):7,
      edges:baseEdges.map(e=>[e[0],e[1],fresh?rand(1,9):e[2]]),
      graphNodes:copy(nodes),topoEdges:copy(directed),tasks:copy(tasks),
      items:[['Map',2,3,'map'],['Rope',3,4,'rope'],['Water',4,8,'water'],['Food',5,8,'food'],['Radio',6,9,'radio']].map(item=>fresh?[item[0],rand(1,5),rand(3,10),item[3]]:item),
      capacity:10,words:fresh?shuffle([['BANANA','BANDANA'],['PLANET','PLANT'],['STONE','LONGEST'],['GARDEN','DANGER']])[0]:['PLANET','PLANT'],
      activities:[['Art',0,3],['Music',1,5],['Chess',4,7],['Dance',3,9],['Film',5,9],['Books',8,11],['Yoga',9,12],['Games',11,14]].map(a=>{if(!fresh)return a;const s=rand(0,11);return[a[0],s,Math.min(14,s+rand(2,5))];}),
      frequencies:[['A',5],['B',9],['C',12],['D',13],['E',16],['F',45]].map(x=>[x[0],fresh?rand(2,30):x[1]])
    };
  }
  class Heap {
    constructor(){this.a=[];this.order=0;}
    compare(a,b){return a.priority-b.priority||a.order-b.order;}
    push(value,priority){const a=this.a,node={value,priority,order:this.order++};a.push(node);let i=a.length-1;while(i){const p=(i-1)>>1;if(this.compare(a[p],node)<=0)break;a[i]=a[p];i=p;}a[i]=node;}
    pop(){const a=this.a,root=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&this.compare(a[c+1],a[c])<0)c++;if(this.compare(last,a[c])<=0)break;a[i]=a[c];i=c;}a[i]=last;}return root.value;}
    get size(){return this.a.length;}
  }
  function neighbors(index,g){const r=Math.floor(index/g.cols),c=index%g.cols;return [[r-1,c],[r,c+1],[r+1,c],[r,c-1]].filter(([y,x])=>y>=0&&x>=0&&y<g.rows&&x<g.cols).map(([y,x])=>y*g.cols+x).filter(i=>!g.walls.includes(i));}
  function pathfinding(id,ex){
    const g=ex.grid,f=[],parent={},dist={[g.start]:0},seen=new Set([g.start]),closed=new Set(),visited=[],open=[g.start],heap=new Heap();
    const guided=!['bfs','dfs'].includes(id),weighted=guided;
    const h=i=>Math.abs(Math.floor(i/g.cols)-Math.floor(g.goal/g.cols))+Math.abs(i%g.cols-g.goal%g.cols);
    const score=i=>id==='dijkstra'?dist[i]:id==='astar'?dist[i]+h(i):h(i);
    heap.push(g.start,score(g.start));
    const snap=data=>frame(f,{kind:'grid',visited:[...visited],frontier:[...seen].filter(i=>!closed.has(i)),path:[],current:null,grid:g,...data});
    snap({message:'The arrow is you. The flag is where you want to go. Press play to start exploring.'});
    while(guided?heap.size:open.length){
      const current=guided?heap.pop():id==='dfs'?open.pop():open.shift();
      if(closed.has(current))continue;closed.add(current);visited.push(current);
      if(current===g.goal){
        const route=[];let p=current;while(p!==undefined){route.unshift(p);p=parent[p];}
        route.forEach((_,i)=>snap({path:route.slice(0,i+1),current:route[i],phase:'Connect the steps',recipe:3,line:3,message:'We reached the flag. Now follow the trail back to see the route.'}));
        const cost=route.slice(1).reduce((sum,i)=>sum+(weighted?g.weights[i]:1),0);
        snap({path:route,current:g.goal,done:true,found:true,cost,phase:'There it is!',recipe:3,line:3,message:`The route takes ${route.length-1} moves${weighted?` and costs ${cost} effort points`:''}. ${id==='dfs'||id==='greedy-best'?'This method finds a route, but does not promise the cheapest one.':'This is a shortest route for these travel costs.'}`});return f;
      }
      const added=[];
      for(const next of neighbors(current,g)){if(closed.has(next))continue;const candidate=dist[current]+(weighted?g.weights[next]:1);if(!seen.has(next)||(id!=='greedy-best'&&guided&&candidate<(dist[next]??Infinity))){seen.add(next);dist[next]=candidate;parent[next]=current;added.push(next);if(guided)heap.push(next,score(next));else open.push(next);}}
      const explanation={bfs:'Check the next closest square, then add its unexplored neighbors to the waiting line.',dfs:'Follow the newest branch. Other branches wait until we come back.',dijkstra:`The cheapest waiting journey costs ${dist[current]} points. Check where it can go next.`,astar:`This journey costs ${dist[current]} so far; the flag is at least ${h(current)} moves away.`, 'greedy-best':`This square looks closest to the flag: ${h(current)} moves away if no walls intervene.`};
      snap({current,phase:added.length?'Looking around':'No new neighbors here',recipe:added.length?1:2,line:2,message:explanation[id]});
    }
    snap({done:true,found:false,phase:'The way is blocked',recipe:3,line:1,message:'Every reachable square has been checked. Remove a wall and give it another try.'});return f;
  }
  function sorting(id,ex){
    const a=[...ex.values],n=a.length,f=[],settled=new Set();let comparisons=0,moves=0;
    const snap=(message,active=[],recipe=0,line=0,extras={})=>frame(f,{kind:'bars',array:a,active,sorted:[...settled],comparisons,moves,message,recipe,line,phase:'Look closely',...extras});
    const swap=(i,j)=>{[a[i],a[j]]=[a[j],a[i]];if(i!==j)moves++;};
    snap('Let’s arrange these numbers from smallest to largest. Follow the orange bars.',[],0,0,{phase:'Ready when you are'});
    if(id==='bubble')for(let end=n-1;end>0;end--){let changed=false;for(let i=0;i<end;i++){comparisons++;snap(`${a[i]} and ${a[i+1]} are neighbors. ${a[i]>a[i+1]?'The left one is larger, so they need to switch.':'They are already in the right order.'}`,[i,i+1],0,3);if(a[i]>a[i+1]){const left=a[i],right=a[i+1];swap(i,i+1);changed=true;snap(`${right} goes before ${left}. A small swap brings us closer to order.`,[i,i+1],1,4,{phase:'Change places'});}}settled.add(end);snap(`${a[end]} is now in its final place. Leave it there and repeat.`,[end],2,0);if(!changed)break;}
    if(id==='selection')for(let left=0;left<n-1;left++){let min=left;for(let j=left+1;j<n;j++){comparisons++;snap(`The smallest so far is ${a[min]}. Is ${a[j]} smaller?`,[min,j],1,3);if(a[j]<a[min])min=j;}const value=a[min];swap(left,min);settled.add(left);snap(`${value} is the smallest remaining number. It gets the next place.`,[left],2,4,{phase:'A place of its own'});}
    if(id==='insertion'){settled.add(0);for(let i=1;i<n;i++){let j=i;const key=a[i];snap(`Pick up ${key}. The numbers to its left are already ordered.`,[i],1,1);while(j>0){comparisons++;snap(`Compare ${a[j-1]} and ${key}. ${a[j-1]>key?'Make some room on the left.':'This is where the new number belongs.'}`,[j-1,j],2,3);if(a[j-1]<=a[j])break;swap(j-1,j);j--;snap(`${key} slides one place to the left.`,[j,j+1],2,4,{phase:'Make room'});}settled.add(i);snap(`${key} is in the right place in this growing ordered group.`,[j],3,6);}}
    if(id==='merge'){
      const merge=(lo,hi)=>{if(hi-lo<2)return;const mid=Math.floor((lo+hi)/2);snap('Split this group in two. Smaller groups are easier to put in order.',[],0,2,{range:[lo,hi-1]});merge(lo,mid);merge(mid,hi);let left=a.slice(lo,mid),right=a.slice(mid,hi),out=[];while(left.length&&right.length){comparisons++;snap(`The front numbers are ${left[0]} and ${right[0]}. Take the smaller one next.`,[a.indexOf(left[0]),a.indexOf(right[0])],2,5,{range:[lo,hi-1]});const value=left[0]<=right[0]?left.shift():right.shift();out.push(value);a.splice(lo,hi-lo,...out,...left,...right);moves++;snap(`${value} joins the ordered group.`,[lo+out.length-1],3,5,{range:[lo,hi-1],phase:'Bring together'});}a.splice(lo,hi-lo,...out,...left,...right);snap('These two groups now form one ordered group.',[],3,4,{range:[lo,hi-1]});};merge(0,n);
    }
    if(id==='quick'){
      const quick=(lo,hi)=>{if(lo>hi)return;if(lo===hi){settled.add(lo);return;}const pivot=a[hi];let p=lo;snap(`${pivot} is our reference. Smaller numbers belong on its left.`,[hi],0,2,{pivot,range:[lo,hi]});for(let i=lo;i<hi;i++){comparisons++;snap(`Is ${a[i]} smaller than or equal to ${pivot}?`,[i,hi],1,5,{pivot,range:[lo,hi]});if(a[i]<=pivot){const value=a[i];swap(i,p);snap(`${value} belongs in the smaller group.`,[p],1,5,{pivot,range:[lo,hi]});p++;}}swap(p,hi);settled.add(p);snap(`${pivot} is between the smaller and larger groups. Its place is final.`,[p],2,2,{pivot});quick(lo,p-1);quick(p+1,hi);};quick(0,n-1);
    }
    if(id==='heap'){
      const sift=(size,root)=>{while(root*2+1<size){let largest=root,left=root*2+1,right=left+1;comparisons++;if(a[left]>a[largest])largest=left;if(right<size){comparisons++;if(a[right]>a[largest])largest=right;}snap(`Position ${root+1} is the parent. Compare it with children ${left+1}${right<size?` and ${right+1}`:''}.`,[root,left,...(right<size?[right]:[])],0,4);if(largest===root)break;swap(root,largest);snap('The larger child moves up toward the front.',[root,largest],2,3,{phase:'Move the winner up'});root=largest;}};for(let i=Math.floor(n/2)-1;i>=0;i--)sift(n,i);for(let end=n-1;end>0;end--){const biggest=a[0];swap(0,end);settled.add(end);snap(`${biggest} is the largest left. Send it to its final place at the end.`,[end],1,2);sift(end,0);}
    }
    seq(n).forEach(i=>settled.add(i));snap(`All in order! ${comparisons} comparisons helped arrange ${n} numbers from small to large.`,[],3,0,{done:true,phase:'A tidy little staircase'});return f;
  }
  function searching(id,ex){
    const a=id==='binary'?[...ex.values].sort((a,b)=>a-b):[...ex.values],target=ex.target,f=[],checked=[];let checks=0;
    const snap=data=>frame(f,{kind:'search',array:a,target,checked,checks,active:-1,range:[0,a.length-1],...data});
    snap({message:`Find the card with ${target}. ${id==='binary'?'The cards are in order, so we can use the middle as a shortcut.':'We’ll check the cards one by one.'}`});
    if(id==='linear'){for(let i=0;i<a.length;i++){checks++;snap({active:i,recipe:1,line:1,phase:'Check this card',message:`This card is ${a[i]}. ${a[i]===target?'It matches our number!':'Keep looking.'}`});if(a[i]===target){snap({active:i,found:i,done:true,recipe:3,line:2,phase:'Found it!',message:`${target} is at position ${i+1}. We checked ${checks} cards.`});return f;}checked.push(i);}}
    else{let lo=0,hi=a.length-1;while(lo<=hi){const mid=Math.floor((lo+hi)/2);checks++;snap({active:mid,range:[lo,hi],recipe:1,line:2,phase:'Check the middle',message:`The middle card is ${a[mid]}. We are looking for ${target}.`});if(a[mid]===target){snap({active:mid,range:[mid,mid],found:mid,done:true,recipe:3,line:3,phase:'Found it!',message:`${target} found in just ${checks} check${checks===1?'':'s'}.`});return f;}if(a[mid]<target){for(let i=lo;i<=mid;i++)checked.push(i);lo=mid+1;}else{for(let i=mid;i<=hi;i++)checked.push(i);hi=mid-1;}snap({range:[lo,hi],recipe:2,line:a[mid]<target?4:5,phase:'Let that half go',message:`${target} is ${a[mid]<target?'larger':'smaller'} than ${a[mid]}. The faded cards cannot be the answer.`});}}
    snap({done:true,recipe:3,phase:'Not in this collection',message:`We checked every possible place. There is no ${target} here.`});return f;
  }
  function graph(id,ex){
    const f=[],selected=[],visited=[],graphNodes=ex.graphNodes||nodes,nodeNames=graphNodes.map(n=>n[0]);
    const snap=data=>frame(f,{kind:'graph',nodes:graphNodes,edges:ex.edges,selected,visited,active:-1,...data});
    if(id==='topological'){
      const graphTasks=ex.tasks||tasks,taskName=name=>Object.hasOwn(graphTasks,name)?graphTasks[name]:name,topoEdges=(ex.topoEdges||directed).filter(e=>nodeNames.includes(e[0])&&nodeNames.includes(e[1]));
      const degree=Object.fromEntries(nodeNames.map(name=>[name,0])),order=[];topoEdges.forEach(e=>degree[e[1]]++);const waiting=nodeNames.filter(name=>degree[name]===0);
      const topSnap=data=>snap({directed:true,edges:topoEdges,tasks:graphTasks,order,degree,...data});
      topSnap({message:`The arrows mean “do this before that”. ${waiting.length?`Ready first: ${waiting.map(taskName).join(', ')}.`:'Every node is waiting on another node.'}`});
      while(waiting.length){const node=waiting.shift();order.push(node);visited.push(node);topSnap({recipe:1,line:3,phase:'One node is ready',message:`${taskName(node)} has no unfinished nodes blocking it. Put it next in the order.`});topoEdges.filter(e=>e[0]===node).forEach(e=>{degree[e[1]]--;if(degree[e[1]]===0)waiting.push(e[1]);});topSnap({recipe:2,line:5,phase:'What can happen next?',message:waiting.length?`Ready now: ${waiting.map(taskName).join(', ')}.`:order.length===nodeNames.length?'All the nodes are finished.':'No node is ready, so the remaining arrows form a cycle.'});}
      if(order.length<nodeNames.length)topSnap({done:true,found:false,recipe:3,phase:'A cycle blocks the order',message:`No valid order exists. ${nodeNames.filter(x=>!order.includes(x)).map(taskName).join(', ')} are caught in a dependency cycle.`});
      else topSnap({done:true,found:true,recipe:3,phase:'A possible plan',message:'Every node comes after its prerequisites. Other valid orders may work too.'});return f;
    }
    const validEdges=ex.edges.filter(e=>nodeNames.includes(e[0])&&nodeNames.includes(e[1])),edges=validEdges.map((e,i)=>({u:e[0],v:e[1],w:e[2],i}));
    const graphSnap=data=>frame(f,{kind:'graph',nodes:graphNodes,edges:validEdges,selected,visited,active:-1,...data});
    if(id==='prim'){
      const start=nodeNames[0],tree=new Set(start?[start]:[]);if(start)visited.push(start);graphSnap({message:start?`Start at node ${start}. We want to connect every node with the lowest total cost.`:'Add a node to begin designing the network.'});
      while(tree.size<graphNodes.length){const e=edges.filter(e=>tree.has(e.u)!==tree.has(e.v)).sort((a,b)=>a.w-b.w)[0];if(!e)break;graphSnap({active:e.i,recipe:1,line:2,phase:'The cheapest way to grow',message:`${e.u}–${e.v} costs ${e.w}. It is the cheapest edge from our network to a new node.`});const next=tree.has(e.u)?e.v:e.u;tree.add(next);visited.push(next);selected.push(e.i);graphSnap({active:e.i,recipe:2,line:3,phase:'Add this node',message:`Node ${next} is connected. Now look for the next useful edge.`});}
    }else{
      const parent=Object.fromEntries(nodeNames.map(name=>[name,name]));const find=x=>parent[x]===x?x:(parent[x]=find(parent[x]));graphSnap({message:'Look at the edge weights. We will try the cheapest ones first.'});
      for(const e of [...edges].sort((a,b)=>a.w-b.w)){graphSnap({active:e.i,recipe:1,line:1,phase:'Consider this connection',message:`Edge ${e.u}–${e.v} costs ${e.w}. Does it connect two separate groups?`});if(find(e.u)!==find(e.v)){parent[find(e.u)]=find(e.v);selected.push(e.i);[e.u,e.v].forEach(x=>{if(!visited.includes(x))visited.push(x);});graphSnap({active:e.i,recipe:2,line:3,phase:'A useful connection',message:`Keep ${e.u}–${e.v}. Two separate groups are now connected.`});}else graphSnap({active:e.i,recipe:2,line:2,phase:'We can skip this edge',message:`${e.u} and ${e.v} are already connected. Another edge would add cost without reaching a new node.`});if(selected.length===graphNodes.length-1)break;}
    }
    const cost=selected.reduce((sum,i)=>sum+validEdges[i][2],0),connected=graphNodes.length>0&&selected.length===graphNodes.length-1;
    graphSnap({cost,done:true,found:connected,recipe:3,phase:connected?'Every node is connected':'This graph is disconnected',message:connected?`${graphNodes.length} nodes, ${selected.length} edges, ${cost} total cost. No extra edges are needed.`:`The chosen edges cannot reach every node. Add a connecting edge and run the algorithm again.`});return f;
  }
  function knapsack(ex){
    const {items,capacity:W}=ex,n=items.length,f=[],table=Array.from({length:n+1},()=>Array(W+1).fill(0));
    const selections=(i,w)=>{const chosen=[];while(i>0){if(table[i][w]!==table[i-1][w]){chosen.unshift(i-1);w-=items[i-1][1];}i--;}return chosen;};
    const snap=data=>frame(f,{kind:'knapsack',items,capacity:W,table,rows:['None',...items.map(x=>x[0])],cols:seq(W+1),current:null,source:[],chosen:[],...data});
    snap({message:`The bag holds ${W} kg. Which items give the highest usefulness score together?`});
    for(let i=1;i<=n;i++)for(let w=1;w<=W;w++){
      const [name,weight,value]=items[i-1],skip=table[i-1][w],fits=weight<=w,take=fits?value+table[i-1][w-weight]:null;table[i][w]=fits?Math.max(skip,take):skip;
      snap({item:i-1,bagSize:w,current:[i,w],source:fits?[[i-1,w],[i-1,w-weight]]:[[i-1,w]],skip,take,chosen:selections(i,w),recipe:fits?2:1,line:fits?5:6,phase:fits?'Take it, or leave it?':'Too heavy for this size',message:fits?`With a ${w} kg bag, skipping ${name} gives ${skip} points. Taking it gives ${take}. ${take>skip?'Taking it wins.':take<skip?'Leaving it wins.':'It is a tie; keep the earlier choice.'}`:`${name} weighs ${weight} kg, so it cannot fit in a ${w} kg bag. Keep the previous best.`});
    }
    const chosen=selections(n,W),weight=chosen.reduce((s,i)=>s+items[i][1],0);snap({done:true,chosen,weight,current:[n,W],bagSize:W,recipe:3,phase:'Packed with a plan',message:`Take ${chosen.map(i=>items[i][0]).join(', ')}: ${weight} kg, ${table[n][W]} usefulness points. That is the best value for this bag.`});return f;
  }
  function lcs(ex){
    const [xText,yText]=ex.words,x=[...xText],y=[...yText],f=[],table=Array.from({length:x.length+1},()=>Array(y.length+1).fill(0));
    const snap=data=>frame(f,{kind:'lcs',x:xText,y:yText,rows:['—',...x],cols:['—',...y],table,current:null,source:[],matches:[],...data});
    snap({message:`Find shared characters in “${xText}” and “${yText}”. You may skip characters, but keep their order.`});
    for(let i=1;i<=x.length;i++)for(let j=1;j<=y.length;j++){const match=x[i-1]===y[j-1];table[i][j]=match?table[i-1][j-1]+1:Math.max(table[i-1][j],table[i][j-1]);snap({current:[i,j],source:match?[[i-1,j-1]]:[[i-1,j],[i,j-1]],recipe:match?1:2,line:match?3:5,phase:match?'A shared character!':'Keep what we already know',message:match?`${x[i-1]} matches ${y[j-1]}. Add one to the best match before these two characters.`:`${x[i-1]} and ${y[j-1]} are different. Keep the longer match from the smaller text pieces.`});}
    let i=x.length,j=y.length;const matches=[],route=[];while(i&&j){route.push([i,j]);if(x[i-1]===y[j-1]){matches.unshift([i-1,j-1]);i--;j--;}else if(table[i-1][j]>=table[i][j-1])i--;else j--;}
    const answer=matches.map(([i])=>x[i]).join('');snap({done:true,current:[x.length,y.length],matches,route,answer,recipe:3,phase:'There is the shared thread',message:`“${answer}” appears in both texts in the same order. Its ${matches.length} characters make a longest shared sequence.`});return f;
  }
  function activity(ex){
    const acts=[...ex.activities].sort((a,b)=>a[2]-b[2]||a[1]-b[1]),f=[],selected=[],rejected=[];let finish=0;
    const snap=data=>frame(f,{kind:'activity',acts,selected,rejected,current:null,finish,...data});
    snap({message:'The events are ordered by when they finish. Choose as many as possible without overlaps.'});
    for(const a of acts){snap({current:a[0],recipe:1,line:3,phase:'Will this one fit?',message:`${a[0]} runs from ${a[1]} to ${a[2]}. ${selected.length?`The room is free from ${finish}.`:'The room is free.'}`});if(a[1]>=finish){selected.push(a[0]);finish=a[2];snap({current:a[0],recipe:1,line:5,phase:'Put it on the schedule',message:`${a[0]} fits. The room will next be free at ${finish}.`});}else{rejected.push(a[0]);snap({current:a[0],recipe:2,line:4,phase:'These times overlap',message:`Skip ${a[0]}. It starts before the current event finishes.`});}}
    snap({done:true,recipe:3,phase:'A fuller day',message:`${selected.length} events fit: ${selected.join(', ')}. No two use the room at the same time.`});return f;
  }
  function huffman(ex){
    const forest=ex.frequencies.map(([label,freq],index)=>({id:`leaf-${index}`,label,freq})),f=[];let serial=0;
    const snap=data=>frame(f,{kind:'huffman',forest:[...forest].sort((a,b)=>a.freq-b.freq),active:[],...data});
    snap({message:'Each number shows how often a letter appears. We will give common letters shorter codes.'});
    while(forest.length>1){forest.sort((a,b)=>a.freq-b.freq);const [left,right]=forest;snap({active:[left.id,right.id],recipe:1,line:2,phase:'Choose the smallest two',message:`The two smallest groups are ${left.freq} and ${right.freq}. Join them together.`});forest.splice(0,2);const node={id:`join-${serial++}`,label:'',freq:left.freq+right.freq,left,right};forest.push(node);snap({active:[node.id],recipe:2,line:5,phase:'Make a new group',message:`${left.freq} + ${right.freq} = ${node.freq}. This new group goes back among the others.`});}
    const codes={};const walk=(node,code)=>{if(node.label)codes[node.label]=code||'0';else{walk(node.left,code+'0');walk(node.right,code+'1');}};walk(forest[0],'');const total=ex.frequencies.reduce((s,[letter,count])=>s+count*codes[letter].length,0);
    snap({codes,total,done:true,recipe:3,phase:'Shortcuts, without losing a letter',message:`Follow left for 0 and right for 1. The ${ex.frequencies.reduce((s,x)=>s+x[1],0)} letters now need ${total} bits; frequent letters usually get shorter paths.`});return f;
  }
  function run(id,example){if(['bfs','dfs','dijkstra','astar','greedy-best'].includes(id))return pathfinding(id,example);if(['bubble','selection','insertion','merge','quick','heap'].includes(id))return sorting(id,example);if(['binary','linear'].includes(id))return searching(id,example);if(['prim','kruskal','topological'].includes(id))return graph(id,example);if(id==='knapsack')return knapsack(example);if(id==='lcs')return lcs(example);if(id==='activity')return activity(example);if(id==='huffman')return huffman(example);throw new Error('Unknown algorithm');}
  return {makeExample,run,nodes,tasks};
})();
