import { Shape } from '@antv/x6';

const createNode = (
  id: string,
  name: string,
  domain: string,
  funcName: string,
  provider: string,
  providerType: string,
) => {
  const schema = {
    base: Shape.Rect,
    shape: `imove-behavior-${id}`,
    width: 60,
    height: 30,
    label: name,
    attrs: {
      body: {
        fill: '#BCD0FF',
        stroke: '#6B8CD7',
        rx: 4,
        ry: 4,
      },
      label: {
        fill: '#333',
        fontSize: 13,
        fontWeight: 500,
        textWrap: { width: '100%' },
      },
    },
    ports: {
      groups: {
        top: {
          position: 'top',
          attrs: {
            circle: {
              r: 2.5,
              magnet: true,
              stroke: '#4E68A3',
              strokeWidth: 2,
              fill: '#fff',
            },
          },
        },
        right: {
          position: 'right',
          attrs: {
            circle: {
              r: 2.5,
              magnet: true,
              stroke: '#4E68A3',
              strokeWidth: 2,
              fill: '#fff',
            },
          },
        },
        bottom: {
          position: 'bottom',
          attrs: {
            circle: {
              r: 2.5,
              magnet: true,
              stroke: '#4E68A3',
              strokeWidth: 2,
              fill: '#fff',
            },
          },
        },
        left: {
          position: 'left',
          attrs: {
            circle: {
              r: 2.5,
              magnet: true,
              stroke: '#4E68A3',
              strokeWidth: 2,
              fill: '#fff',
            },
          },
        },
      },
      items: [
        {
          id: 'top',
          group: 'top',
        },
        {
          id: 'right',
          group: 'right',
        },
        {
          id: 'bottom',
          group: 'bottom',
        },
        {
          id: 'left',
          group: 'left',
        },
      ],
    },
    data: {
      serviceId: id,
      label: name,
      domain,
      funcName,
      provider,
      providerType,
      configSchema: '{\n  \n}',
      configData: {},
      dependencies: '{\n  \n}',
      inputMode: 'default',
      outputMode: 'nopack',
      processCode: `export default async function(
  payload,
  pipe,
  context,
  config
) {
  // you can write code here
  return pipe;
}`,
      loop: false,
      code: `export default async function (ctx) {
  const {funcName, serviceId: id, outputMode, processCode} = ctx.curNode.data;
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
}
`,
    },
  };
  return schema;
};

export default createNode;
