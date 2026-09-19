# AlgoVista

An interactive, dependency-free visual lab for 20 classic algorithms. Every lesson includes a real animation, step controls, plain-language explanation, pseudocode highlighting, complexity, and a fresh-example generator.

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
  app.js
.github/workflows/pages.yml
```
