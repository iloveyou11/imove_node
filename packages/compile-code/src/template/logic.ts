export default `import config from './config';
import Context from './context';
import * as vm from 'vm';
const EventEmitter = require('events');

const LIFECYCLE = new Set(['ctxCreated', 'enterNode', 'leaveNode']);
const SHAPES = {
  START: 'imove-start',
  BRANCH: 'imove-branch',
  BEHAVIOR: 'imove-behavior',
};

export default class Logic extends EventEmitter {
  private dsl;
  private lifeCycleEvents;
  private _unsafeCtx;
  private sandbox;

  constructor(opts = {}) {
    super();
    this.dsl = (opts as any).dsl;
    this.lifeCycleEvents = {};

    this.sandbox = {
      require,
      console,
      module,
    };
    vm.createContext(this.sandbox);
  }

  get cells() {
    return this.dsl.cells;
  }

  get nodes() {
    return this.cells.filter((cell) => cell.shape !== 'edge');
  }

  get startNodes() {
    return this.cells.filter((cell) => cell.shape === SHAPES.START);
  }

  get edges() {
    return this.cells.filter((cell) => cell.shape === 'edge');
  }

  _getUnsafeCtx() {
    // NOTE: don't use in prod
    return this._unsafeCtx;
  }

  _runLifecycleEvent(eventName, ctx) {
    if (!LIFECYCLE.has(eventName)) {
      return console.warn(\`Lifecycle \${eventName} is not supported!\`);
    }
    if (this.lifeCycleEvents[eventName]) {
      this.lifeCycleEvents[eventName].forEach((fn) => fn(ctx));
    }
  }

  _createCtx(opts) {
    const ctx = new Context(opts);
    ctx.emit = this.emit.bind(this);
    this._runLifecycleEvent('ctxCreated', ctx);
    return ctx;
  }

  _getStartNode(trigger) {
    for (const cell of this.startNodes) {
      if (cell.data.trigger === trigger) {
        return cell;
      }
    }
  }

  _getNextNodes(ctx, curNode, curRet) {
    const nodes = [];

    // NOTE: if it is a imove-branch node, find out which port match the curRet condition
    const isCurNodeShapeBranch = curNode.shape === SHAPES.BRANCH;
    let curNodeMatchedPort = '';
    if (isCurNodeShapeBranch) {
      const { ports } = curNode.data;
      for (const key in ports) {
        const { condition } = ports[key];
        // eslint-disable-next-line no-new-func
        const ret = new Function('ctx', 'return ' + condition)(ctx);
        if (ret === Boolean(curRet)) {
          curNodeMatchedPort = key;
          break; // for (const key in ports)
        }
      }
    }

    // NOTE: find out next node via edges which source is curNode
    for (const edge of this.edges) {
      // edge's source is curNode
      const isMatchedSource = edge.source.cell === curNode.id;
      // if it is a imove-branch node, edge.source.port match curRet condition
      const isMatchedPort = !isCurNodeShapeBranch || edge.source.port === curNodeMatchedPort;
      if (isMatchedSource && isMatchedPort) {
        // NOTE: not each edge both has source and target
        const nextNode = this.nodes.find((item) => item.id === edge.target.cell);
        nextNode && nodes.push(nextNode);
      }
    }
    return nodes;
  }

  use(pluginCreator) {
    if (typeof pluginCreator !== 'function') {
      console.error('imove plugin must be a function.');
      return;
    }
    const plugin = pluginCreator(this);
    if (typeof plugin !== 'object' || plugin === null) {
      console.error('imove plugin must return an object.');
      return;
    }
    for (const eventName in plugin) {
      if (!Object.prototype.hasOwnProperty.call(plugin, eventName)) {
        continue;
      }
      if (!LIFECYCLE.has(eventName)) {
        console.warn(\`Lifecycle \${eventName} is not supported in imove.\`);
        continue;
      }
      if (!this.lifeCycleEvents[eventName]) {
        this.lifeCycleEvents[eventName] = [];
      }
      this.lifeCycleEvents[eventName].push(plugin[eventName]);
    }
  }

  async _execNode(ctx, curNode, lastRet) {
    ctx._transitTo(curNode, lastRet);
    this._runLifecycleEvent('enterNode', ctx);
    const code = curNode.data.funcName ? inlineFn : config.nodeFns[curNode.id];

    // replace 兼容
    const fn = vm.runInContext(\`module.exports = $\{code.replace('export default ', '')\}\`, this.sandbox);

    const curRet = await fn(ctx);
    this._runLifecycleEvent('leaveNode', ctx);
    if (curNode.shape !== SHAPES.BRANCH) {
      lastRet = curRet;
    }
    const nextNodes = this._getNextNodes(ctx, curNode, curRet);
    if (nextNodes.length === 1) {
      return this._execNode(ctx, nextNodes[0], lastRet);
    } else if (nextNodes.length > 1) {
      for (const node of nextNodes) {
        await this._execNode(ctx, node, lastRet);
      }
    } else {
      return lastRet;
    }
  }

  async invoke(trigger, data) {
    const curNode = this._getStartNode(trigger);
    if (!curNode) {
      return Promise.reject(new Error(\`Invoke failed! No logic-start named \${trigger} found!\`));
    }
    this._unsafeCtx = this._createCtx({
      payload: data,
      serviceId: curNode.data.serviceId || '',
      funcName: curNode.data.funcName || '',
      provider: curNode.data.provider || '',
      providerType: curNode.data.providerType || '',
      inputMode: curNode.data.inputMode || '',
      outputMode: curNode.data.outputMode || '',
    });
    return this._execNode(this._unsafeCtx, curNode, undefined);
  }
}

const inlineFn = \`async function(ctx) {
  const {funcName, serviceId: id, outputMode} = ctx.curNode.data;
  const providerClass = await getProviderClazz(ctx);
  const params = assembleParams(ctx);

  const rst = await providerClass[funcName](...params);
  const result = getResultWithOutputMode(rst, outputMode);

  ctx.setContext({[id]: result});
  return result;
}

function getProviderClazz(ctx) {
  const {provider, providerType} = ctx.curNode.data;
  const applicationContext = ctx.payload.ctx;
  if (providerType === 'pegasus') {
    return applicationContext.service.pegasus[provider];
  }
  return applicationContext.requestContext.getAsync(provider);
}

/**
 * 入参处理
 */
function assembleParams(ctx) {
  const {serviceId: id, providerType, inputMode} = ctx.curNode.data;

  let params;
  if (inputMode === 'normal') {
    params = ctx.payload.body[id] || [];
  } else if (inputMode === 'default') {
    params = ctx.getPipe() || [];
  } else if (inputMode === 'api') {
    params = ctx.payload.body.data || [];
  } else {
    throw Error('Invalid inputMode: ' + inputMode);
  }

  if (providerType === 'pegasus') {
    const user = ctx.payload.ctx.user;
    params.push(require('@ali/egg-pegasus').AppInfo.from({
      appName: 'zebra', nick: user.cname, workId: user.workid
    }));
  }

  return params;
}

/**
 * 结果处理
 */
function getResultWithOutputMode(rst, outputMode) {
  if (outputMode === 'pack') {
    if (!rst.success) {
      throw Error(rst.message || rst.errorMessage);
    }
    return rst.data;
  }
  return rst;
}\`;
`;
