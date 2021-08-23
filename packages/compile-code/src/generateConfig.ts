import { Cell } from '@antv/x6';
import simplifyDSL from './simplifyDSL';

interface DSL {
  cells: Cell.Properties[];
}

const genNodeFns = (dsl: DSL): object => {
  const nodeFns: { [key: string]: string } = {};
  const { cells = [] } = dsl;
  const nodes = cells.filter((cell) => cell.shape !== 'edge');
  for (const {
    id,
    shape,
    data: { label, code },
  } of nodes) {
    const nodeId: string = id as string;
    const descData = `// ${shape}: ${label}\n`;
    const saveData = `${descData}\n${code}`;
    nodeFns[nodeId] = saveData;
  }
  return nodeFns;
};

const generateConfig = (dsl: DSL): string => {
  const nodeFns = genNodeFns(dsl);
  const config = {
    nodeFns,
    dsl: simplifyDSL(dsl),
  };
  return `export default ${JSON.stringify(config)}`;
};

export default generateConfig;
