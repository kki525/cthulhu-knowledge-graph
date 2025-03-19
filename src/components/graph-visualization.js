// graph-visualization.js

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * @description 将 Neo4j 导出数据转换为 D3.js 可视化格式
 * @param {Array} rawData Neo4j 原始数据（关系数组）
 * @returns {{nodes: Array, links: Array}} 转换后的 D3 数据
 */
const transformNeo4jData = (rawData) => {
  try {
    if (!Array.isArray(rawData)) {
      throw new Error('输入数据必须是数组格式');
    }

    const nodeIds = new Set();
    rawData.forEach(rel => {
      if (!rel || typeof rel.Source !== 'number' || typeof rel.Target !== 'number') {
        console.warn('无效的关系数据:', rel);
        return;
      }
      nodeIds.add(rel.Source);
      nodeIds.add(rel.Target);
    });

    const nodes = Array.from(nodeIds).map(id => ({
      id: id.toString(),  // 统一为字符串类型
      label: `Node ${id}`,
      type: 'Entity'
    }));

    const links = rawData.map(rel => ({
      source: rel.Source.toString(),
      target: rel.Target.toString(),
      type: rel.RelationshipType || '关联'
    }));

    return { nodes, links };

  } catch (error) {
    console.error('数据转换失败:', error);
    return { nodes: [], links: [] };
  }
};

/**
 * @description React D3.js 知识图谱可视化组件
 * @param {Object} props 组件属性
 * @param {string} props.dataUrl 数据文件路径
 */
const GraphVisualization = ({ dataUrl }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const renderGraph = async () => {
      try {
        if (!svgRef.current) return;

        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`HTTP 请求失败: ${response.status}`);
        }

        const rawData = await response.json();
        const data = transformNeo4jData(rawData);

        if (!data.nodes.length) {
          console.warn('未加载到有效节点数据');
          return;
        }

        // D3 力导向图设置
        const width = 1200;
        const height = 800;

        const simulation = d3.forceSimulation(data.nodes)
          .force("link", d3.forceLink(data.links).id(d => d.id).distance(120))
          .force("charge", d3.forceManyBody().strength(-600))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collide", d3.forceCollide().radius(d => (d.size || 10) + 5));

        const svg = d3.select(svgRef.current)
          .attr("width", width)
          .attr("height", height)
          .style("background", "#f0f8ff");

        // 渲染关系线
        const links = svg.append("g")
          .selectAll("line")
          .data(data.links)
          .join("line")
          .attr("stroke", "#778899")
          .attr("stroke-width", d => Math.sqrt(d.weight || 1) * 1.5);

        // 渲染节点
        const nodes = svg.append("g")
          .selectAll("circle")
          .data(data.nodes)
          .join("circle")
          .attr("r", d => d.size || 10)
          .attr("fill", d => d.color || "#6495ed")
          .call(d3.drag()
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
            }));

        // 添加节点标签
        const labels = svg.append("g")
          .selectAll("text")
          .data(data.nodes)
          .join("text")
          .text(d => `${d.label} [${d.type}]`)
          .attr("font-size", 11)
          .attr("dx", 15)
          .attr("dy", 4)
          .style("fill", "#333");

        // 更新动力学
        simulation.on("tick", () => {
          links
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

          nodes
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

          labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        });

      } catch (error) {
        console.error("可视化渲染失败:", error);
      }
    };

    renderGraph();
  }, [dataUrl]); // 依赖 dataUrl 变化

  return <svg ref={svgRef} />;
};

export default GraphVisualization;

