import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// 节点类型（包含 D3 的动力学属性）
interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  size?: number;
  color?: string;
}

// 关系类型（包含 D3 的链接属性）
interface Link extends d3.SimulationLinkDatum<Node> {
  type: string;
  weight?: number;
}

// 组件属性类型
interface Props {
  dataUrl: string;
}

const GraphVisualization: React.FC<Props> = ({ dataUrl }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const loadAndRender = async () => {
      try {
        if (!svgRef.current) return;

        // 加载数据并断言为正确类型
        const response = await fetch(dataUrl);
        const data: { nodes: Node[]; links: Link[] } = await response.json();

        if (!data.nodes.length) return;

        // Force 动力学模拟引擎初始化 ----------------------------------------
        const width = 1200;
        const height = 800;

        // 正确类型泛型 <Node, Link>
        const simulation = d3.forceSimulation<Node, Link>(data.nodes)
          .force("link", d3.forceLink<Node, Link>(data.links)
            .id(d => d.id)  // 确保传递的 id 生成函数接受 Node 类型
            .distance(120)
          )
          .force("charge", d3.forceManyBody().strength(-600))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collide", d3.forceCollide<Node>()
            .radius(d => (d.size || 10) + 5)  // 接受 Node 类型参数
          );

        // SVG 容器设置 ------------------------------------------
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current)
          .attr("width", width)
          .attr("height", height)
          .style("background", "#f0f8ff");

        // 绘制关系线 (处理 Link 类型) --------------------------------------
        const links = svg.append("g")
          .selectAll<SVGLineElement, Link>("line")
          .data(data.links)
          .join("line")
          .attr("stroke", "#778899")
          .attr("stroke-width", d => Math.sqrt(d.weight || 1) * 1.5);

        // 绘制节点 (处理 Node 类型) ----------------------------------------
        const nodes = svg.append("g")
          .selectAll<SVGCircleElement, Node>("circle")
          .data(data.nodes)
          .join("circle")
          .attr("r", d => d.size || 10)
          .attr("fill", d => d.color || "#6495ed")
          // 泛型声明: <SVGCircleElement, Node>
          .call(d3.drag<SVGCircleElement, Node>()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
          );

        // 节点标签 (处理 Node 类型) --------------------------------------
        const labels = svg.append("g")
          .selectAll<SVGTextElement, Node>("text")
          .data(data.nodes)
          .join("text")
          .text(d => `${d.label} [${d.type}]`)
          .attr("font-size", 11)
          .attr("dx", 15)
          .attr("dy", 4)
          .style("fill", "#333");

        // 动力学更新 (处理 Link 和 Node 类型) -------------------------------
        simulation.on("tick", () => {
          links
            .attr("x1", d => (d.source as Node).x!)
            .attr("y1", d => (d.source as Node).y!)
            .attr("x2", d => (d.target as Node).x!)
            .attr("y2", d => (d.target as Node).y!);

          nodes
            .attr("cx", d => d.x!)
            .attr("cy", d => d.y!);

          labels
            .attr("x", d => d.x!)
            .attr("y", d => d.y!);
        });

      } catch (error) {
        console.error("可视化渲染错误:", error);
      }
    };

    loadAndRender();
  }, [dataUrl]);

  return <svg ref={svgRef} />;
};

export default GraphVisualization;
