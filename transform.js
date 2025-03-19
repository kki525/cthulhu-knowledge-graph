const fs = require('fs');
const path = require('path');

// 1. 数据文件路径（根据实际情况修改）
const INPUT_PATH = path.resolve(__dirname, 'public/data/neo4j_query_table_data_2025-3-19.json');
const OUTPUT_PATH = path.resolve(__dirname, 'public/data/graph_data.json');

// 2. 读取 Neo4j 原始数据
try {
  const rawData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

  // 3. 数据转换逻辑
  const transformedData = transformNeo4jData(rawData);

  // 4. 写入转换后的数据
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(transformedData, null, 2));

  console.log('数据转换成功！');
  console.log(`- 输入文件: ${INPUT_PATH}`);
  console.log(`- 输出文件: ${OUTPUT_PATH}`);

} catch (error) {
  console.error('数据处理出错:', error);
}

/**
 * 将 Neo4j 数据转换为 D3.js 可视化格式
 * @param {Array} rawData Neo4j 原始数据（关系数组）
 * @returns {{nodes: Array, links: Array}} 转换后的 D3 数据
 */
function transformNeo4jData(rawData) {
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
      id: id.toString(),  // 将节点 ID 转换为字符串
      label: `Node ${id}`, // 节点标签，可以根据需要修改
      type: 'Entity'       // 节点类型，可以根据需要修改
    }));

    const links = rawData.map(rel => ({
      source: rel.Source.toString(),  // 将源节点 ID 转换为字符串
      target: rel.Target.toString(),  // 将目标节点 ID 转换为字符串
      type: rel.RelationshipType || '关联' // 关系类型，如果没有则默认为“关联”
    }));

    return { nodes, links };

  } catch (error) {
    console.error('数据转换失败:', error);
    return { nodes: [], links: [] };
  }
}

