import { Cell } from '@antv/x6';
import addPlugins from './addPlugins';
import generateConfig from './generateConfig';
import logicTpl from './template/logic';
import indexTpl from './template/index';
import contextTpl from './template/context';

interface DSL {
  cells: Cell.Properties[];
}

interface IOutput {
  'context.ts': string;
  'index.ts': string;
  'logic.ts': string;
  'config.ts': string;
}

const compile = (dsl: DSL, plugins = []): IOutput => {
  const output: IOutput = {
    'context.ts': contextTpl,
    'index.ts': addPlugins(indexTpl, plugins),
    'logic.ts': logicTpl,
    'config.ts': generateConfig(dsl),
  };
  return output;
};

export default compile;
