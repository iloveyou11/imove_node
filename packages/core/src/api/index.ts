import axios from 'axios';
import { message } from 'antd';

const LOCAL_CONFIG_KEY = 'IMOVE:LOCAL_CONFIG_KEY';
export interface ILocalConfig {
  ip: string;
  port: string;
  npmRegistry: string;
}

export enum ActionType {
  create = 'create',
  update = 'update',
  remove = 'remove',
}

export interface IModifyGraphAction {
  type: string;
  actionType: ActionType;
  data: any;
}

interface RequestConfig {
  url: string;
  method?: 'get' | 'post';
  params?: { [key: string]: any };
  headers?: { [key: string]: string };
}

const request = (function () {
  const instance = axios.create();
  instance.interceptors.response.use((response: any) => {
    const { data } = response || {};
    const { success, msg } = data || {};
    if (success) {
      return data;
    } else {
      message.error(msg);
      return Promise.reject(data);
    }
  });
  return (config: RequestConfig) => {
    const { url, method = 'post', params, headers = {} } = config;
    return instance.request({
      url,
      method,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        ...headers,
      },
      data: params,
      timeout: 3000,
    });
  };
})();

/**
 * get local config data (saved in localStorage)
 * @returns local config
 */
export const getLocalConfig = (): ILocalConfig => {
  const savedConfigString = localStorage.getItem(LOCAL_CONFIG_KEY) || '';
  let savedConfig = {} as ILocalConfig;
  try {
    savedConfig = JSON.parse(savedConfigString);
  } catch (e) {}
  return {
    ip: savedConfig.ip || '127.0.0.1',
    port: savedConfig.port || '3500',
    npmRegistry: savedConfig.npmRegistry || 'https://registry.npm.taobao.org',
  };
};

/**
 * get local config data (saved in localStorage)
 */
export const updateLocalConfig = (config: ILocalConfig) => {
  const savedConfig = getLocalConfig();
  savedConfig.ip = config.ip || savedConfig.ip;
  savedConfig.port = config.port || savedConfig.port;
  savedConfig.npmRegistry = (
    config.npmRegistry || savedConfig.npmRegistry
  ).replace(/\/$/, '');
  localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(savedConfig));
};

// export const localConnect = () => {
//   const localConfig = getLocalConfig();
//   return fetch(`http://${localConfig.ip}:${localConfig.port}/api/connect`, {
//     method: 'GET',
//     headers: { 'content-type': 'application/json' },
//   });
// };

export const localSave = async (data: any) => {
  // 同步到本地db.json
  // const localConfig = getLocalConfig();
  // fetch(`http://${localConfig.ip}:${localConfig.port}/api/save`, {
  //   method: 'POST',
  //   headers: { 'content-type': 'application/json' },
  //   body: JSON.stringify({ dsl: data }),
  // });

  // 同步到新的后端接口，整个config对象作为body
  const nodeFns: any = {};
  const cells = data.cells;
  cells.forEach((cell: any) => {
    if (cell.shape !== 'edge') {
      nodeFns[cell.id] = cell.data?.processCode || '';
    }
  });
  const result = {
    nodeFns,
    dsl: cells,
  };
  const res: any = await axios.post('/web/api/dynamic/admin/save', result);
  if (res.success) {
    console.log('编排内容保存成功！');
  } else {
    console.log('编排内容保存失败，请重试！');
  }
};

export const queryGraph = async (projectId: string) => {
  const result: any = await axios.post('/web/api/dynamic/admin/load');
  const { success, data } = result;
  if (success) {
    const { dsl } = data;
    console.log('加载数据成功！');
    return { data: { cells: dsl } };
  } else {
    console.log('加载数据失败，请重试！');
    return { data: {} };
  }
};

export const modifyGraph = (
  projectId: string,
  actions: IModifyGraphAction[],
) => {
  return request({
    url: '/api/modifyGraph',
    params: {
      projectId,
      actions,
    },
  });
};
