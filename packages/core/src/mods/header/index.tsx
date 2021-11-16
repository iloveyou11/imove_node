import React, { useState, useCallback } from 'react';

import styles from './index.module.less';

import { Graph } from '@antv/x6';
import { Modal, message } from 'antd';
import Guide from './guide';
import Export from './export';
import ImportDSL from './importDSL';
import ImportNodes from './importNodes';
import Publish from './publish';
import ConnectStatus, { Status } from './connectStatus';
import Configuration from './configuration';
// import { localConnect } from '../../api';
import createNode from '../flowChart/createNode';

interface IProps {
  flowChart: Graph;
}

const Header: React.FC<IProps> = (props: IProps) => {
  const { flowChart } = props;
  const [projectName, setProjectName] = useState<string>('');
  const [status, setStatus] = useState<Status>(Status.disconnected);

  // network
  // const syncLocal = useCallback(() => {
  //   return localConnect()
  //     .then((res) => res.json())
  //     .then((data = {}) => {
  //       setStatus(Status.connected);
  //       setProjectName(data.projectName);
  //       return data;
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //       setStatus(Status.disconnected);
  //       console.log('connect local failed, the error is:', error.message);
  //     });
  // }, [setStatus, setProjectName]);

  // const confirmToSync = useCallback(() => {
  //   return syncLocal().then((data) => {
  //     const { dsl } = data || {};
  //     if (dsl) {
  //       Modal.confirm({
  //         title: '本地连接成功，是否将数据同步至当前项目？',
  //         onOk() {
  //           try {
  //             // 先注册节点，否则会同步失败
  //             const extendCell: any = {};
  //             dsl.cells.forEach((item: any) => {
  //               if (
  //                 item.shape !== 'imove-start' &&
  //                 item.shape !== 'imove-branch' &&
  //                 item.shape !== 'edge'
  //               ) {
  //                 const {
  //                   serviceId,
  //                   label,
  //                   domain,
  //                   funcName,
  //                   provider,
  //                   providerType,
  //                 } = item.data;
  //                 extendCell[item.shape] = createNode(
  //                   serviceId,
  //                   label,
  //                   domain,
  //                   funcName,
  //                   provider,
  //                   providerType,
  //                 );
  //               }
  //             });
  //             const nodes = Object.values(extendCell);
  //             if (nodes.length > 0) {
  //               nodes.forEach((schema: any) => {
  //                 const { base, ...rest } = schema;
  //                 base.define(rest);
  //               });
  //             }
  //             flowChart.fromJSON(dsl);
  //           } catch (error) {
  //             message.error('同步失败！');
  //           }
  //         },
  //       });
  //     }
  //   });
  // }, [syncLocal, flowChart]);

  return (
    <div className={styles.container}>
      <a href="https://github.com/imgcook/imove">
        <span className={styles.titleText}>iMove</span>
      </a>
      <div className={styles.widgets}>
        <Guide />
        <Export flowChart={flowChart} />
        <ImportDSL flowChart={flowChart} />
        <ImportNodes />
        <Publish flowChart={flowChart}  />
        {/* <ConnectStatus
          status={status}
          projectName={projectName}
          syncLocal={syncLocal}
          confirmToSync={confirmToSync}
        /> */}
        {/* <Configuration confirmToSync={confirmToSync} /> */}
      </div>
    </div>
  );
};

export default Header;
