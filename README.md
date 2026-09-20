# AlgoVista

An interactive, dependency-free playground for 20 classic algorithms. Each lesson starts with an everyday story, one simple rule, and a live explanation of the current move. No programming knowledge is needed.

The notebook-inspired interface includes moving sorting bars, animated map exploration, editable walls and endpoints, search cards, graph networks, packing choices, letter matching, schedules, and growing Huffman trees. Number lists, search targets, text pairs, and Huffman frequencies can be replaced with custom input. Graph lessons include a designer for adding and removing labeled nodes and weighted or directed edges; nodes can be dragged into any layout. Technical explanations and pseudocode are available in an optional disclosure below each lesson. Reduced-motion preferences are respected.

## Update an existing GitHub Pages site

Upload **all files in the updated `dist` folder** into the repository's existing `dist` folder, keeping the folder name. Commit the changes. The existing Pages workflow will deploy the update automatically. You do not need to change Pages settings or create another workflow.

There are now six required website files: `index.html`, `styles.css`, `app.js`, `algorithms.js`, `lessons.js`, and `simulations.js`. Include all six when updating. After deployment, refresh the live site; use Ctrl+Shift+R if the old appearance is cached.

## Algorithms

- Pathfinding: Breadth-First Search, Depth-First Search, Dijkstra, A*, Greedy Best-First
- Sorting: Bubble, Selection, Insertion, Merge, Quick, Heap
- Searching: Binary Search, Linear Search
- Graphs: Prim, Kruskal, Topological Sort
- Dynamic programming: 0/1 Knapsack, Longest Common Subsequence
- Greedy: Activity Selection, Huffman Coding

## Preview locally

Open `dist/index.html` directly, or serve the folder with any static web server.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab and let **Deploy AlgoVista to GitHub Pages** finish.
5. The deployment summary contains the public `github.io` URL.

The included workflow publishes only the `dist` directory.

## Connect a custom domain

The exact DNS value depends on the domain you own, so it cannot be filled in safely until that domain is known.

1. In **Settings → Pages → Custom domain**, enter the domain (for example, `algorithms.example.com`) and save it.
2. For a subdomain, add a DNS `CNAME` record pointing to `<your-github-username>.github.io`.
3. For an apex domain, use the `A`, `AAAA`, `ALIAS`, or `ANAME` records shown in GitHub’s current Pages documentation.
4. Wait for GitHub’s DNS check, then enable **Enforce HTTPS**.

Because this project deploys with a custom GitHub Actions workflow, GitHub manages the custom-domain setting for the Pages site; a generated `CNAME` file is not required.

## Project structure

```text
dist/
  index.html
  styles.css
  app.js           # interaction and drawing
  algorithms.js    # technical reference
  lessons.js       # beginner stories
  simulations.js   # independent algorithm traces
.github/workflows/pages.yml
tests/simulations.cjs
```

Run the algorithm correctness checks with `node tests/simulations.cjs` (Node.js 18+). The checks compare shortest paths and optimization results against independent or exhaustive reference solutions.
