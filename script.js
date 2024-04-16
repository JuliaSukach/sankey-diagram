
// Spesify url of the data
const URL = "tests/data.json"
// Specify the dimensions of the chart.
let currentWidth = document.getElementsByClassName('chart-wrapper')[0].offsetWidth
const width = currentWidth
const height = 800
const format = d3.format(",.0f")

// Create a SVG container.
const svg = d3.select(".chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100% height: auto font: 10px sans-serif")

// Constructs and configures a Sankey generator.
const sankey = d3.sankey()
    .nodeId(d => d.name)
    .nodeAlign(d3.sankeyJustify) // d3.sankeyLeft, etc.
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 5], [width - 1, height - 5]])

// Load JSON data using d3.json()
d3.json(URL)
    .then(function(data) {
        // Applies it to the data. We make a copy of the nodes and links objects
        // so as to avoid mutating the original.
        data.links = data.links.map(row => {
            row.source = data.nodes[row.source]?.name ?? row.source
            row.target = data.nodes[row.target]?.name ?? row.target
            return row
        })
        const {nodes, links} = sankey({
            nodes: data.nodes.map(d => Object.assign({}, d)),
            links: data.links.map(d => Object.assign({}, d))
        })

        // Defines a color scale.
        const color = d3.scaleOrdinal(d3.schemeCategory10)

        // Creates the rects that represent the nodes.
        const rect = svg.append("g")
            .selectAll()
            .data(nodes)
            .join("rect")
                .attr("class", "node")
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("height", d => d.y1 - d.y0)
                .attr("width", d => d.x1 - d.x0)
                .attr("fill", d => color(d.category ?? d.name))
                .on('mouseover.node', showLinks)
                .on('mouseout.node', hideLinks)
                .on('click.node', function(event, d) {
                    // Execute showInfo function
                    showInfo(event, d, this)
                    // Remove the mouseout.node event listener
                    rect.on('mouseover.node', null)
                    rect.on('mouseout.node', null)
                })
                .attr("cursor", "pointer")

        // Adds a title on the nodes.
        rect.append("title")
            .text(d => `${d.name}\n${format(d.value)} TWh`)

        // Creates the paths that represent the links.
        const link = svg.append("g")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.5)
            .selectAll()
            .data(links)
            .join("g")
                .style("mix-blend-mode", "multiply")

        // Creates a gradient, if necessary, for the source-target color option.
        const gradient = link.append("linearGradient")
            .attr("id", function(d) {
                d.uid = `link-${d.index}`
                return d.uid
            })
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", d => d.source.x1)
            .attr("x2", d => d.target.x0)
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d => color(d.source.category))
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d => color(d.target.category))

        link.append("path")
            .attr('class', 'link')
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", (d) => `url(#${d.uid})`)
            .attr("stroke-width", d => Math.max(1, d.width))

        link.append("title")
            .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)} TWh`)

        // Adds labels on the nodes.
        const nodeLabels = svg.append("g")
            .selectAll()
            .data(nodes)
            .join("g")
            .attr('class', 'text')
            .attr("transform", d => `translate(${d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6},${(d.y1 + d.y0) / 2})`)
            .style('opacity', 0)

        // Append text and background rectangle to each group
        nodeLabels.each(function(d) {
            const group = d3.select(this)
            const text = group.append("text")
                .attr("x", d => d.x0 < width / 2 ? 6 : -6) // Adjust this value as needed
                .attr("dy", "0.35em")
                .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
                .text(d => d.name) // Assuming 'name' property holds the text
                .attr('fill', '#ffffff')
                .attr("font-family", "Helvetica Neue")
                .attr("font-weight", "bold")
                .attr("font-size", "10px")
                .style('pointer-events', 'none')

            // Calculate text's bounding box
            const bbox = text.node().getBBox()

            // Append rectangle behind text
            group.insert("rect", "text")
                .attr("x", bbox.x - 3) // Adjust this value as needed
                .attr("y", bbox.y - 3) // Adjust this value as needed
                .attr("width", bbox.width + 6) // Adjust this value as needed
                .attr("height", bbox.height + 6) // Adjust this value as needed
                .attr("fill", "#414b61")
                .style('pointer-events', 'none')
        })

        function showLinks(event, d, target) {
            const linkedNodes = []
            target = target ?? this

            let traverse = [{
                linkType : 'sourceLinks',
                nodeType : 'target',
            }, {
                linkType : 'targetLinks',
                nodeType : 'source',
            }]

            traverse.forEach((step) => {
                d[step.linkType].forEach((l) => {
                    linkedNodes.push(l[step.nodeType])
                })
            })

            d3.selectAll('rect.node').style(
                'opacity',
                r => linkedNodes.find(remainingNode => remainingNode.name === r.name) ? '1' : '0.1'
            )
            d3.select(target).style('opacity', '1')
            d3.selectAll('g.text').style(
                'opacity',
                r => linkedNodes.find(remainingNode => remainingNode.name === r.name) || r.name === d.name ? '1' : '0'
            )
            d3.selectAll('path').style(
                'opacity',
                p => (p && (p.source.name === d.name || p.target.name === d.name)) ? '1' : '0.1'
            )
            return linkedNodes
        }

        function hideLinks() {
            d3.selectAll('rect.node').style('opacity', '1')
            d3.selectAll('path').style('opacity', '1')
            d3.selectAll('g.text').style('opacity', 0)
        }

        function showInfo(event, d, target) {
            let linkedNodes = showLinks(event, d, target)
            // Append the linked nodes HTML content to the selected block
            const selectedBlock = document.getElementById('selected-block')
            // Clear existing HTML content
            selectedBlock.innerHTML = ''
            linkedNodes.forEach((node) => {
                const row = document.createElement('div')
                row.className = 'row targets';

                const targetSpan = document.createElement('span')
                targetSpan.className = 'target';

                const gutterSpan = document.createElement('span')
                gutterSpan.className = 'gutter'
                gutterSpan.style.backgroundColor = color(node.category ?? node.name)
                targetSpan.appendChild(gutterSpan);

                const nodeNameSpan = document.createElement('span')
                nodeNameSpan.textContent = node.name
                targetSpan.appendChild(nodeNameSpan)

                row.appendChild(targetSpan)

                const valueSpan = document.createElement('span')
                valueSpan.textContent = node.value
                row.appendChild(valueSpan)

                selectedBlock.appendChild(row)
            })
            document.getElementsByClassName('selected-node')[0].innerHTML = d.name
        }
    })
    .catch(function(error) {
        // Handle any errors that occur during the loading process
        console.error("Error loading the JSON file:", error)
    })