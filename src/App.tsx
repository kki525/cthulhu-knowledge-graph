   // src/App.tsx
   import React from 'react';
   import GraphVisualization from './components/Graph';

   function App() { // No props needed
     return (
       <div style={{ padding: '20px', width: '100vw', height: '100vh', overflow: 'hidden' }}>
         <h1 style={{ textAlign: 'center' }}>知识图谱可视化</h1>
         <GraphVisualization dataUrl="/data/graph_data.json" />
       </div>
     );
   }

   export default App;
   