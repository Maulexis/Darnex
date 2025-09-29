import React from 'react';

const Performance = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>AI Performance Analysis</h2>
      <ul>
        <li>Congestion Data Live</li>
        <li>Average Delay of Each Train</li>
        <li>Instruction Effectiveness & Efficiency Improvement</li>
      </ul>

      <h3>Instruction Analysis:</h3>
      <ul>
        <li><strong>Instruction:</strong> Prioritize express trains → <em>Reason:</em> Reduce delays → <strong>Result:</strong> Delay reduced by 5 mins</li>
        <li><strong>Instruction:</strong> Reallocate platforms → <em>Reason:</em> Reduce congestion → <strong>Result:</strong> Congestion improved by 20%</li>
      </ul>
    </div>
  );
};

export default Performance;
